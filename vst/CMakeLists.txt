cmake_minimum_required(VERSION 3.22)
project(Omnifon VERSION 1.4.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "Minimum macOS deployment version")

include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 8.0.4
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_binary_data(OmnifonWebUI
    SOURCES
        WebUI.zip
)

if(APPLE)
    set(OMNIFON_FORMATS AU VST3 Standalone)
else()
    set(OMNIFON_FORMATS VST3 Standalone)
endif()

juce_add_plugin(Omnifon
    COMPANY_NAME "Lauro Robles"
    COMPANY_WEBSITE "https://laurorobles.github.io/Omnifon/"
    BUNDLE_ID "com.laurorobles.omnifon"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    NEEDS_WEBVIEW2 TRUE
    COPY_PLUGIN_AFTER_BUILD TRUE
    PLUGIN_MANUFACTURER_CODE Lrob
    PLUGIN_CODE Omni
    FORMATS ${OMNIFON_FORMATS}
    PRODUCT_NAME "Omnifon"
)

target_sources(Omnifon
    PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginEditor.cpp
)

target_include_directories(Omnifon
    PRIVATE
        Source
        Source/DSP
)

target_compile_definitions(Omnifon
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(Omnifon
    PRIVATE
        OmnifonWebUI
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)
