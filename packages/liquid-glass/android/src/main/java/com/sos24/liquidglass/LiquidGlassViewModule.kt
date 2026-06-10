package com.sos24.liquidglass

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiquidGlassViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiquidGlassNative")

    View(LiquidGlassView::class) {
      Prop("backdropId") { view: LiquidGlassView, v: Int ->
        view.backdropId = v
      }
      Prop("cornerRadius") { view: LiquidGlassView, v: Float ->
        view.cornerRadiusDp = v; view.requestRedraw()
      }
      Prop("refractionHeight") { view: LiquidGlassView, v: Float ->
        view.refractionHeightDp = v; view.requestRedraw()
      }
      Prop("refractionAmount") { view: LiquidGlassView, v: Float ->
        view.refractionAmountDp = v; view.requestRedraw()
      }
      Prop("blurRadius") { view: LiquidGlassView, v: Float ->
        view.blurRadiusDp = v; view.requestRedraw()
      }
      Prop("depthEffect") { view: LiquidGlassView, v: Boolean ->
        view.depthEffect = v; view.requestRedraw()
      }
      Prop("highlightOpacity") { view: LiquidGlassView, v: Float ->
        view.highlightOpacity = v; view.requestRedraw()
      }
      Prop("highlightAngle") { view: LiquidGlassView, v: Float ->
        view.highlightAngleRad = Math.toRadians(v.toDouble()).toFloat(); view.requestRedraw()
      }
      Prop("highlightFalloff") { view: LiquidGlassView, v: Float ->
        view.highlightFalloff = v; view.requestRedraw()
      }
    }
  }
}
