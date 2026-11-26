#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include "PluginProcessor.h"
#include <array>
#include <memory>
#include <vector>

class OmnifonV2LookAndFeel : public juce::LookAndFeel_V4 {
public:
    OmnifonV2LookAndFeel();

    const juce::Image& getWalnutImage() const noexcept { return walnutImg; }
    const juce::Image& getAluminumImage() const noexcept { return aluminumImg; }

    void drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                          float sliderPosProportional, float rotaryStartAngle,
                          float rotaryEndAngle, juce::Slider& slider) override;

    void drawLinearSlider(juce::Graphics& g, int x, int y, int width, int height,
                          float sliderPos, float minSliderPos, float maxSliderPos,
                          juce::Slider::SliderStyle style, juce::Slider& slider) override;

    void drawButtonBackground(juce::Graphics& g, juce::Button& button,
                              const juce::Colour& backgroundColour,
                              bool shouldDrawButtonAsHighlighted,
                              bool shouldDrawButtonAsDown) override;

private:
    void generatePbrAssets();
    juce::Image walnutImg;
    juce::Image aluminumImg;
    juce::Image knobBlackImg;
    juce::Image knobSilverImg;
};

class OscilloscopeView : public juce::Component {
public:
    explicit OscilloscopeView(OmnifonAudioProcessor& p) : processor(p) {}
    void paint(juce::Graphics& g) override;
private:
    OmnifonAudioProcessor& processor;
};

struct JackSocket {
    bool isInput = false;
    int pinId = 0;
    juce::Point<float> center;
    juce::String label;
};

class CableLayerComponent : public juce::Component {
public:
    CableLayerComponent(OmnifonAudioProcessor& p, const std::vector<JackSocket>& jacks);

    void setFaded(bool faded) { isFaded = faded; repaint(); }
    bool getFaded() const noexcept { return isFaded; }

    bool hitTest(int x, int y) override;
    void paint(juce::Graphics& g) override;
    void mouseDown(const juce::MouseEvent& e) override;
    void mouseDrag(const juce::MouseEvent& e) override;
    void mouseUp(const juce::MouseEvent& e) override;

private:
    const JackSocket* findJackAt(juce::Point<float> pt, float maxDist = 11.0f) const;
    juce::Point<float> findOutCenter(omnifon::OutPin pin) const;
    juce::Point<float> findInCenter(omnifon::InPin pin) const;

    OmnifonAudioProcessor& processor;
    const std::vector<JackSocket>& jacks;
    bool isFaded = false;

    bool dragging = false;
    bool dragFromInput = false;
    int dragPinId = 0;
    juce::Point<float> dragStart;
    juce::Point<float> dragCurrent;
};

class OmnifonAudioProcessorEditor : public juce::AudioProcessorEditor,
                                    private juce::Timer {
public:
    explicit OmnifonAudioProcessorEditor(OmnifonAudioProcessor&);
    ~OmnifonAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;
    void syncNonApvtsControlsFromProcessor();
    void updateWindowHeight();
    void showInfoMenu();

    struct KnobControl {
        juce::Slider slider;
        juce::Label label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;
    };

    KnobControl* addKnob(const juce::String& paramId, const juce::String& title,
                         bool isSilver = false, bool showText = false);

    OmnifonAudioProcessor& audioProcessor;
    OmnifonV2LookAndFeel lnf;

    // Top bar
    juce::TextButton patchPrevBtn { "<" };
    juce::ComboBox patchBox;
    juce::TextButton patchNextBtn { ">" };
    juce::ToggleButton dawSyncBtn { "DAW SYNC" };
    juce::ComboBox dawDivBox;
    juce::ToggleButton dawTransportBtn { "TRANSPORT" };
    juce::TextButton dimCablesBtn { "Atenuar" };
    juce::TextButton clearCablesBtn { "Sin cables" };
    juce::TextButton toggleKbBtn { "Teclado" };
    juce::TextButton infoMenuBtn { "Info / Docs" };
    juce::Label bpmLabel;

    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> dawSyncAtt;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> dawDivAtt;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> dawTransportAtt;

    // APVTS knobs
    std::vector<std::unique_ptr<KnobControl>> knobs;
    KnobControl *kEnvNivel, *kEnvMod, *kAnilloNivel, *kRevInt, *kRevTiempo;
    KnobControl *kIntAtaque, *kIntDur, *kIntDec;
    KnobControl *kOsc1Freq, *kOsc1Mod, *kOsc1Ancho;
    KnobControl *kOsc2Freq, *kOsc2Mod;
    KnobControl *kFivCentro, *kFivAncho, *kFivMod;
    KnobControl *kPulReloj, *kPulAncho;
    KnobControl *kTecPort, *kSalVol;

    // Integrador & Pulsador controls
    juce::ToggleButton intAutoBtn { "int." };
    juce::TextButton intTrigBtn { "pulso" };
    juce::TextButton pulStartBtn { "inicio" };
    juce::TextButton pulStopBtn { "fin" };

    // Filtro-O (10 bands + Corte + Suma)
    juce::Slider fioCorteSlider;
    juce::Slider fioSumaSlider;
    std::array<juce::Slider, 10> fioBandSliders;

    // Sequencer 3x10 knobs + 10 step switches
    std::array<juce::Slider, 30> seqKnobs;
    std::array<juce::ToggleButton, 10> seqSwitches;

    // Jacks & Cable overlay
    std::vector<JackSocket> jacks;
    std::unique_ptr<CableLayerComponent> cableLayer;

    // Oscilloscope & Hideable MIDI Keyboard
    OscilloscopeView scope;
    juce::MidiKeyboardComponent keyboard;
    bool showKeyboard = false;

    int activeStep = 0;

    static constexpr int kWidth = 1200;
    static constexpr int kHeightNoKb = 700;
    static constexpr int kHeightWithKb = 834;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(OmnifonAudioProcessorEditor)
};
