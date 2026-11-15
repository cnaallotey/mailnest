<script setup lang="ts">
// Lightweight WebGL background: domain-warped noise in the Mailnest palette that bends toward the pointer.
// No library. Pauses when off screen or in a hidden tab, renders one still frame for reduced motion,
// and falls back to a CSS gradient when WebGL is unavailable.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ intensity?: number }>(), { intensity: 1 })
const canvas = ref<HTMLCanvasElement>()
const failed = ref(false)

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uInt;
float hash(vec2 p){ p = mod(p, 289.); vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.02 + 3.1; a *= .5; } return v; }
void main(){
  vec2 p = (gl_FragCoord.xy - .5*uRes) / uRes.y;
  vec2 m = (uMouse - .5*uRes) / uRes.y;
  float d = length(p - m);
  float pull = exp(-d*d*5.);
  float t = uTime * .06;
  vec2 q = vec2(fbm(p*1.4 + t), fbm(p*1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p*1.4 + 3.5*q + vec2(1.7, 9.2) + t*1.3), fbm(p*1.4 + 3.5*q + vec2(8.3, 2.8) - t));
  r += (p - m) * pull * .35;
  float f = fbm(p*1.4 + 3.*r);
  vec3 col = mix(vec3(.025, .022, .06), vec3(.13, .09, .42), smoothstep(.2, .9, f));
  col += vec3(.43, .37, .99) * pow(f, 3.2) * 1.5 * uInt;
  col += vec3(.35, .62, 1.) * pow(length(q) * .7, 4.) * .5 * uInt;
  col += vec3(.55, .5, 1.) * pull * .16 * uInt;
  vec2 g = fract(gl_FragCoord.xy / 22.) - .5;
  col += smoothstep(.07, .0, length(g)) * .05;
  vec2 uv = gl_FragCoord.xy / uRes;
  col *= .55 + .45 * pow(16. * uv.x * uv.y * (1.-uv.x) * (1.-uv.y), .25);
  gl_FragColor = vec4(col, 1.);
}`

let raf = 0, visible = true, gl: WebGLRenderingContext | null = null
let io: IntersectionObserver | undefined, ro: ResizeObserver | undefined
const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
let cleanupPointer = () => {}

onMounted(() => {
  const c = canvas.value!
  gl = c.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' })
  if (!gl) { failed.value = true; return }
  const sh = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return s }
  const prog = gl.createProgram()!
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { failed.value = true; return }
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime')
  const uMouse = gl.getUniformLocation(prog, 'uMouse'), uInt = gl.getUniformLocation(prog, 'uInt')
  gl.uniform1f(uInt, props.intensity)

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const resize = () => {
    c.width = Math.max(1, Math.round(c.clientWidth * dpr))
    c.height = Math.max(1, Math.round(c.clientHeight * dpr))
    gl!.viewport(0, 0, c.width, c.height)
    gl!.uniform2f(uRes, c.width, c.height)
    if (!mouse.tx) { mouse.x = mouse.tx = c.width * .7; mouse.y = mouse.ty = c.height * .6 }
  }
  resize()
  ro = new ResizeObserver(resize); ro.observe(c)

  const host = c.parentElement!
  const onMove = (e: PointerEvent) => {
    const b = c.getBoundingClientRect()
    mouse.tx = (e.clientX - b.left) * dpr
    mouse.ty = (b.height - (e.clientY - b.top)) * dpr
  }
  host.addEventListener('pointermove', onMove)
  cleanupPointer = () => host.removeEventListener('pointermove', onMove)

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = performance.now() - 20000
  const frame = (now: number) => {
    mouse.x += (mouse.tx - mouse.x) * .06
    mouse.y += (mouse.ty - mouse.y) * .06
    gl!.uniform1f(uTime, (now - start) / 1000)
    gl!.uniform2f(uMouse, mouse.x, mouse.y)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame)
    else raf = 0
  }
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame) }
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!reduce) kick() })
  io.observe(c)
  document.addEventListener('visibilitychange', kick)
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf); io?.disconnect(); ro?.disconnect(); cleanupPointer()
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
})
</script>

<template>
  <div class="shader" :class="{ failed }" aria-hidden="true">
    <canvas v-if="!failed" ref="canvas" />
  </div>
</template>

<style scoped>
.shader { position: absolute; inset: 0; overflow: hidden; background: #07061a; }
.shader.failed { background: radial-gradient(80% 70% at 70% 60%, #3a2fb8 0%, #15104a 45%, #07061a 100%); }
canvas { width: 100%; height: 100%; display: block; }
</style>
