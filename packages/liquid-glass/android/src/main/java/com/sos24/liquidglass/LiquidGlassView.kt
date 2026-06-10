package com.sos24.liquidglass

import android.content.Context
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Стеклянная поверхность. Преломляет фон (снимок LiquidGlassBackdropView с тем же
 * backdropId) по AGSL-шейдеру Kyant + рисует блик по краю.
 *
 * Фон берётся как Bitmap-снимок (без стёкол) и подаётся в шейдер через
 * setInputShader("content", bitmapShader) — без RenderNode, поэтому нет цикла.
 *
 * На < API 33 (нет RuntimeShader) — мягкий fallback. iOS этот модуль не использует.
 */
class LiquidGlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val density = resources.displayMetrics.density

  var cornerRadiusDp: Float = 28f
  var refractionHeightDp: Float = 22f
  var refractionAmountDp: Float = 26f
  var blurRadiusDp: Float = 6f
  var depthEffect: Boolean = false
  var highlightOpacity: Float = 0.5f
  var highlightAngleRad: Float = (-Math.PI / 4).toFloat()
  var highlightFalloff: Float = 3f
  var backdropId: Int = 0

  private val refractionShader: RuntimeShader? by lazy {
    if (Build.VERSION.SDK_INT >= 33) runCatching { RuntimeShader(Shaders.REFRACTION) }.getOrNull() else null
  }
  private val highlightShader: RuntimeShader? by lazy {
    if (Build.VERSION.SDK_INT >= 33) runCatching { RuntimeShader(Shaders.HIGHLIGHT) }.getOrNull() else null
  }

  private val glassPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val fallbackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(150, 255, 255, 255) }
  private val clipPath = Path()
  private val tmpRect = RectF()
  private val loc = IntArray(2)
  private val backLoc = IntArray(2)
  private val shaderMatrix = Matrix()

  init {
    setWillNotDraw(false)
    setLayerType(LAYER_TYPE_HARDWARE, null)
  }

  fun requestRedraw() = invalidate()

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    LiquidGlassBackdropView.registry[backdropId]?.subscribers?.add(this)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    LiquidGlassBackdropView.registry[backdropId]?.subscribers?.remove(this)
  }

  override fun onDraw(canvas: Canvas) {
    val backdrop = LiquidGlassBackdropView.registry[backdropId]
    // Во время capture-прохода фона стекло не рисуем — чтобы не попасть в снимок.
    if (backdrop?.capturing == true) return

    val w = width
    val h = height
    if (w == 0 || h == 0) return

    val rPx = cornerRadiusDp * density
    tmpRect.set(0f, 0f, w.toFloat(), h.toFloat())
    clipPath.reset()
    clipPath.addRoundRect(tmpRect, rPx, rPx, Path.Direction.CW)

    backdrop?.subscribers?.add(this)
    val bmp = backdrop?.captureBitmap
    val shader = refractionShader

    if (bmp == null || bmp.isRecycled || shader == null) {
      canvas.drawPath(clipPath, fallbackPaint)
      drawHighlight(canvas, w, h, rPx)
      return
    }

    // Смещение стекла относительно фон-вью → выравниваем снимок.
    getLocationInWindow(loc)
    backdrop.getLocationInWindow(backLoc)
    val dx = (loc[0] - backLoc[0]).toFloat()
    val dy = (loc[1] - backLoc[1]).toFloat()

    val bmpShader = BitmapShader(bmp, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
    shaderMatrix.reset()
    shaderMatrix.setTranslate(-dx, -dy)
    bmpShader.setLocalMatrix(shaderMatrix)

    shader.setInputShader("content", bmpShader)
    shader.setFloatUniform("size", w.toFloat(), h.toFloat())
    shader.setFloatUniform("offset", 0f, 0f)
    shader.setFloatUniform("cornerRadii", floatArrayOf(rPx, rPx, rPx, rPx))
    shader.setFloatUniform("refractionHeight", refractionHeightDp * density)
    shader.setFloatUniform("refractionAmount", -(refractionAmountDp * density))
    shader.setFloatUniform("depthEffect", if (depthEffect) 1f else 0f)

    glassPaint.shader = shader
    canvas.save()
    canvas.clipPath(clipPath)
    canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), glassPaint)
    canvas.restore()

    drawHighlight(canvas, w, h, rPx)
  }

  private fun drawHighlight(canvas: Canvas, w: Int, h: Int, rPx: Float) {
    val hs = highlightShader ?: return
    if (highlightOpacity <= 0f) return
    hs.setFloatUniform("size", w.toFloat(), h.toFloat())
    hs.setFloatUniform("cornerRadii", floatArrayOf(rPx, rPx, rPx, rPx))
    hs.setColorUniform("color", Color.argb((highlightOpacity * 255).toInt(), 255, 255, 255))
    hs.setFloatUniform("angle", highlightAngleRad)
    hs.setFloatUniform("falloff", highlightFalloff)
    highlightPaint.shader = hs
    canvas.save()
    canvas.clipPath(clipPath)
    canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), highlightPaint)
    canvas.restore()
  }
}
