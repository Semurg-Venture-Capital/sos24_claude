package com.sos24.liquidglass

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PorterDuff
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Оборачивает контент сцены и снимает его в Bitmap (исключая стеклянные поверхности) —
 * это «фон» (content), который LiquidGlassView преломляет.
 *
 * Захват в Bitmap (а не в RenderNode) разрывает цикл glass↔backdrop:
 * во время capture-прохода стёкла пропускают отрисовку (флаг capturing), поэтому
 * снимок их не содержит, и стекло может безопасно его сэмплить.
 *
 * Связь со стеклом — по числовому backdropId через общий реестр.
 */
class LiquidGlassBackdropView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  companion object {
    val registry = HashMap<Int, LiquidGlassBackdropView>()
  }

  var backdropId: Int = 0
    set(value) {
      if (field != 0) registry.remove(field)
      field = value
      if (value != 0) registry[value] = this
    }

  // Снимок фона (без стёкол). Доступен стеклу для сэмплинга.
  var captureBitmap: Bitmap? = null
    private set

  // true во время capture-прохода — стёкла в это время не рисуются.
  @Volatile
  var capturing = false
    private set

  private var captureCanvas: Canvas? = null
  val subscribers = HashSet<LiquidGlassView>()

  override fun dispatchDraw(canvas: Canvas) {
    val w = width
    val h = height
    if (w <= 0 || h <= 0) {
      super.dispatchDraw(canvas)
      return
    }

    val bmp = captureBitmap
    if (bmp == null || bmp.width != w || bmp.height != h) {
      captureBitmap?.recycle()
      captureBitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      captureCanvas = Canvas(captureBitmap!!)
    }

    // 1) Capture-проход: сцена БЕЗ стёкол → bitmap.
    val cc = captureCanvas!!
    cc.drawColor(0, PorterDuff.Mode.CLEAR)
    capturing = true
    try {
      super.dispatchDraw(cc)
    } finally {
      capturing = false
    }

    // 2) Реальный проход на экран (стёкла рисуются и сэмплят свежий снимок).
    super.dispatchDraw(canvas)

    // Подтолкнуть стёкла к перерисовке поверх обновлённого снимка.
    if (subscribers.isNotEmpty()) {
      for (g in subscribers) g.invalidate()
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    if (backdropId != 0) registry.remove(backdropId)
    captureBitmap?.recycle()
    captureBitmap = null
  }
}
