#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "PluginProcessor.h"
#include <memory>

class OmnifonAudioProcessorEditor : public juce::AudioProcessorEditor,
                                    private juce::Timer {
public:
    explicit OmnifonAudioProcessorEditor(OmnifonAudioProcessor&);
    ~OmnifonAudioProcessorEditor() override = default;

    void resized() override;

private:
    void timerCallback() override;
    void handleNativeCall(const juce::String& action, const juce::String& jsonPayload);

    static omnifon::OutPin parseOutPin(const juce::String& spec);
    static omnifon::InPin parseInPin(const juce::String& spec);

    OmnifonAudioProcessor& audioProcessor;
    std::unique_ptr<juce::WebBrowserComponent> webView;
    bool uiReady = false;

    static constexpr int kWidth = 1280;
    static constexpr int kHeightWithKb = 880;
    static constexpr int kHeightNoKb = 760;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(OmnifonAudioProcessorEditor)
};
