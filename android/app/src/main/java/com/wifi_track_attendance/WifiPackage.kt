package com.wifi_track_attendance

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * WifiPackage — registers WifiModule with React Native's package system.
 *
 * This class tells React Native to include our custom WifiModule in the
 * list of available native modules. It's added to MainApplication.kt.
 */
class WifiPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(WifiModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
