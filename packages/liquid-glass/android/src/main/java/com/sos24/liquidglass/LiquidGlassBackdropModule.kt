package com.sos24.liquidglass

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiquidGlassBackdropModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiquidGlassBackdrop")

    View(LiquidGlassBackdropView::class) {
      Prop("backdropId") { view: LiquidGlassBackdropView, v: Int ->
        view.backdropId = v
      }
    }
  }
}
