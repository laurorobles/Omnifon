#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include "DSP/PatchMatrix.h"
#include <atomic>
#include <array>
#include <vector>

class OmnifonAudioProcessor : public juce::AudioProcessor {
public:
    OmnifonAudioProcessor();
    ~OmnifonAudioProcessor() override = default;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 2.5; }

    int getNumPrograms() override { return static_cast<int>(factoryPatches.size()); }
    int getCurrentProgram() override { return currentPatchIndex.load(); }
    void setCurrentProgram(int index) override;
    const juce::String getProgramName(int index) override;
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState apvts;
    juce::MidiKeyboardState keyboardState;

    // Live telemetry for UI
    std::atomic<double> liveHostBpm { 120.0 };
    std::atomic<bool> liveDawPlaying { false };
    std::atomic<int> liveSeqStep { 0 };
    std::atomic<int> currentPatchIndex { 0 };

    // Lock-free oscilloscope buffer
    static constexpr int kScopeSize = 512;
    std::array<float, kScopeSize> scopeBuffer {};
    std::atomic<int> scopeWritePos { 0 };

    const std::vector<omnifon::FactoryPatch>& getPatches() const noexcept { return factoryPatches; }
    void loadFactoryPatch(int index);

    // Interactive Cable API (thread-safe via patchLock)
    std::vector<omnifon::Cable> getCables() const;
    void connectCable(omnifon::OutPin from, omnifon::InPin to);
    void disconnectInput(omnifon::InPin to);
    void clearAllCables();

    // Sequencer 3x10 & Filtro-O & Trigger API (thread-safe)
    void setSeqKnob(int index, float val01);
    float getSeqKnob(int index) const;
    void setSeqSwitch(int step, bool on);
    bool getSeqSwitch(int step) const;
    void setFiltroOBand(int band, float val01);
    float getFiltroOBand(int band) const;
    void setFiltroOCorte(float val01);
    float getFiltroOCorte() const;
    void setFiltroOSuma(float val01);
    float getFiltroOSuma() const;
    void setIntegradorAutoCycle(bool autoCycle);
    bool getIntegradorAutoCycle() const;
    void setIntegradorManual(bool down);
    void triggerPulsador(bool start);

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    void syncParamsToRack();

    omnifon::OmnifonRack rack;
    std::vector<omnifon::FactoryPatch> factoryPatches;
    std::vector<omnifon::Cable> activeCables;
    mutable juce::SpinLock patchLock;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(OmnifonAudioProcessor)
};
