#include "PluginProcessor.h"
#include "PluginEditor.h"

OmnifonAudioProcessor::OmnifonAudioProcessor()
    : AudioProcessor(BusesProperties().withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "OMNIFON_PARAMS", createParameterLayout()),
      factoryPatches(omnifon::getFactoryPatches()) {
    loadFactoryPatch(0); // Default: 1 · Fig. IV.38
}

juce::AudioProcessorValueTreeState::ParameterLayout OmnifonAudioProcessor::createParameterLayout() {
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> p;

    // ── DAW Sync Parameters
    p.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID { "daw_sync", 1 }, "DAW Sync", false));
    p.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID { "daw_div", 1 }, "DAW Division",
        juce::StringArray { "1/1", "1/2", "1/4", "1/8", "1/8T", "1/16", "1/16T", "1/32" }, 5));
    p.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID { "daw_transport", 1 }, "DAW Transport", true));

    // ── Pulsador
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "pul_reloj", 1 }, "Pulsador Reloj (Hz)",
        juce::NormalisableRange<float>(0.1f, 40.0f, 0.01f, 0.35f), 4.5f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "pul_ancho", 1 }, "Pulsador Ancho", 0.05f, 0.95f, 0.35f));

    // ── Oscilador 1 & 2
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "osc1_freq", 1 }, "Osc 1 Frecuencia",
        juce::NormalisableRange<float>(5.0f, 20000.0f, 0.01f, 0.25f), 196.0f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "osc1_mod", 1 }, "Osc 1 FM", 0.0f, 1.0f, 0.12f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "osc1_ancho", 1 }, "Osc 1 Ancho", 0.05f, 0.95f, 0.5f));

    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "osc2_freq", 1 }, "Osc 2 Frecuencia",
        juce::NormalisableRange<float>(0.2f, 20000.0f, 0.01f, 0.25f), 293.66f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "osc2_mod", 1 }, "Osc 2 FM", 0.0f, 1.0f, 0.0f));

    // ── Filtro-V
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "fiv_centro", 1 }, "Filtro-V Centro",
        juce::NormalisableRange<float>(5.0f, 15000.0f, 0.1f, 0.25f), 520.0f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "fiv_ancho", 1 }, "Filtro-V Ancho", 0.0f, 1.0f, 0.28f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "fiv_mod", 1 }, "Filtro-V Mod", 0.0f, 5.0f, 2.2f));

    // ── Integrador Envolv.
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "int_ataque", 1 }, "Integrador Ataque",
        juce::NormalisableRange<float>(0.005f, 5.0f, 0.001f, 0.3f), 0.008f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "int_duracion", 1 }, "Integrador Duracion",
        juce::NormalisableRange<float>(0.005f, 5.0f, 0.001f, 0.3f), 0.06f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "int_decaimiento", 1 }, "Integrador Decaimiento",
        juce::NormalisableRange<float>(0.005f, 5.0f, 0.001f, 0.3f), 0.18f));

    // ── Envolvedor, Anillo, Reverberal, Teclado, Salida
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "env_nivel", 1 }, "Envolvedor Nivel", 0.0f, 1.0f, 0.0f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "env_mod", 1 }, "Envolvedor Mod", 0.0f, 1.0f, 0.9f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "anillo_nivel", 1 }, "Mod. Anular Nivel", 0.0f, 1.0f, 0.75f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "rev_int", 1 }, "Reverberal Intensidad", 0.0f, 1.0f, 0.42f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "rev_tiempo", 1 }, "Reverberal Tiempo", 0.0f, 1.0f, 0.68f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "tec_portamento", 1 }, "Teclado Portamento", 0.0f, 2.0f, 0.0f));
    p.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID { "sal_volumen", 1 }, "Salida Volumen", 0.0f, 1.0f, 0.65f));

    return { p.begin(), p.end() };
}

void OmnifonAudioProcessor::loadFactoryPatch(int index) {
    if (index < 0 || index >= static_cast<int>(factoryPatches.size())) return;
    const auto& p = factoryPatches[static_cast<size_t>(index)];
    {
        const juce::SpinLock::ScopedLockType sl(patchLock);
        rack.applyPatch(p);
        activeCables = p.cables;
    }
    currentPatchIndex.store(index);

    auto setParam = [this](const char* id, float value) {
        if (auto* param = apvts.getParameter(id)) {
            param->setValueNotifyingHost(param->convertTo0to1(value));
        }
    };
    setParam("pul_reloj", p.pulsadorReloj);
    setParam("pul_ancho", p.pulsadorAncho);
    setParam("osc1_freq", p.osc1Freq);
    setParam("osc1_mod", p.osc1Mod);
    setParam("osc1_ancho", p.osc1Ancho);
    setParam("osc2_freq", p.osc2Freq);
    setParam("osc2_mod", p.osc2Mod);
    setParam("fiv_centro", p.fivCentro);
    setParam("fiv_ancho", p.fivAncho);
    setParam("fiv_mod", p.fivMod);
    setParam("int_ataque", p.intAtaque);
    setParam("int_duracion", p.intDuracion);
    setParam("int_decaimiento", p.intDecaimiento);
    setParam("env_nivel", p.envNivel);
    setParam("env_mod", p.envMod);
    setParam("anillo_nivel", p.anilloNivel);
    setParam("rev_int", p.revIntensidad);
    setParam("rev_tiempo", p.revTiempo);
    setParam("tec_portamento", p.tecPortamento);
    setParam("sal_volumen", p.salVolumen);
}

std::vector<omnifon::Cable> OmnifonAudioProcessor::getCables() const {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return activeCables;
}

void OmnifonAudioProcessor::connectCable(omnifon::OutPin from, omnifon::InPin to) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    activeCables.erase(
        std::remove_if(activeCables.begin(), activeCables.end(),
                       [to](const omnifon::Cable& c) { return c.to == to; }),
        activeCables.end());
    activeCables.push_back({ from, to });
    rack.setCables(activeCables);
}

void OmnifonAudioProcessor::disconnectInput(omnifon::InPin to) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    activeCables.erase(
        std::remove_if(activeCables.begin(), activeCables.end(),
                       [to](const omnifon::Cable& c) { return c.to == to; }),
        activeCables.end());
    rack.setCables(activeCables);
}

void OmnifonAudioProcessor::clearAllCables() {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    activeCables.clear();
    rack.setCables(activeCables);
}

void OmnifonAudioProcessor::setSeqKnob(int index, float val01) {
    if (index < 0 || index >= 30) return;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.secuenciador.s[static_cast<size_t>(index)] = std::clamp(val01, 0.0f, 1.0f);
}

float OmnifonAudioProcessor::getSeqKnob(int index) const {
    if (index < 0 || index >= 30) return 0.0f;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.secuenciador.s[static_cast<size_t>(index)];
}

void OmnifonAudioProcessor::setSeqSwitch(int step, bool on) {
    if (step < 0 || step >= 10) return;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.secuenciador.sw[static_cast<size_t>(step)] = on;
}

bool OmnifonAudioProcessor::getSeqSwitch(int step) const {
    if (step < 0 || step >= 10) return true;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.secuenciador.sw[static_cast<size_t>(step)];
}

void OmnifonAudioProcessor::setFiltroOBand(int band, float val01) {
    if (band < 0 || band >= 10) return;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.filtroo.gains[static_cast<size_t>(band)] = std::clamp(val01, 0.0f, 1.0f);
}

float OmnifonAudioProcessor::getFiltroOBand(int band) const {
    if (band < 0 || band >= 10) return 0.7f;
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.filtroo.gains[static_cast<size_t>(band)];
}

void OmnifonAudioProcessor::setFiltroOCorte(float val01) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.filtroo.corte = std::clamp(val01, 0.0f, 1.0f);
}

float OmnifonAudioProcessor::getFiltroOCorte() const {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.filtroo.corte;
}

void OmnifonAudioProcessor::setFiltroOSuma(float val01) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.filtroo.suma = std::clamp(val01, 0.0f, 1.0f);
}

float OmnifonAudioProcessor::getFiltroOSuma() const {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.filtroo.suma;
}

void OmnifonAudioProcessor::setIntegradorAutoCycle(bool autoCycle) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.integrador.autoCycle = autoCycle;
}

bool OmnifonAudioProcessor::getIntegradorAutoCycle() const {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    return rack.integrador.autoCycle;
}

void OmnifonAudioProcessor::setIntegradorManual(bool down) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.integrador.manual = down;
}

void OmnifonAudioProcessor::triggerPulsador(bool start) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.pulsador.running = start;
    if (start) rack.pulsador.ph = 0.0;
}

void OmnifonAudioProcessor::setCurrentProgram(int index) {
    loadFactoryPatch(index);
}

const juce::String OmnifonAudioProcessor::getProgramName(int index) {
    if (index >= 0 && index < static_cast<int>(factoryPatches.size()))
        return juce::String::fromUTF8(factoryPatches[static_cast<size_t>(index)].name);
    return {};
}

void OmnifonAudioProcessor::prepareToPlay(double sampleRate, int) {
    const juce::SpinLock::ScopedLockType sl(patchLock);
    rack.prepare(sampleRate);
    rack.setCables(activeCables);
}

bool OmnifonAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const {
    return layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo();
}

void OmnifonAudioProcessor::syncParamsToRack() {
    rack.pulsador.reloj = apvts.getRawParameterValue("pul_reloj")->load();
    rack.pulsador.ancho = apvts.getRawParameterValue("pul_ancho")->load();
    rack.osc1.frecuencia = apvts.getRawParameterValue("osc1_freq")->load();
    rack.osc1.modulador = apvts.getRawParameterValue("osc1_mod")->load();
    rack.osc1.ancho = apvts.getRawParameterValue("osc1_ancho")->load();
    rack.osc2.frecuencia = apvts.getRawParameterValue("osc2_freq")->load();
    rack.osc2.modulador = apvts.getRawParameterValue("osc2_mod")->load();
    rack.filtrov.centro = apvts.getRawParameterValue("fiv_centro")->load();
    rack.filtrov.ancho = apvts.getRawParameterValue("fiv_ancho")->load();
    rack.filtrov.modulacion = apvts.getRawParameterValue("fiv_mod")->load();
    rack.integrador.ataque = apvts.getRawParameterValue("int_ataque")->load();
    rack.integrador.duracion = apvts.getRawParameterValue("int_duracion")->load();
    rack.integrador.decaimiento = apvts.getRawParameterValue("int_decaimiento")->load();
    rack.envolvedor.nivel = apvts.getRawParameterValue("env_nivel")->load();
    rack.envolvedor.mod = apvts.getRawParameterValue("env_mod")->load();
    rack.anillo.nivel = apvts.getRawParameterValue("anillo_nivel")->load();
    rack.reverberal.intensidad = apvts.getRawParameterValue("rev_int")->load();
    rack.reverberal.tiempo = apvts.getRawParameterValue("rev_tiempo")->load();
    rack.teclado.portamento = apvts.getRawParameterValue("tec_portamento")->load();
    rack.salida.volumen = apvts.getRawParameterValue("sal_volumen")->load();
}

void OmnifonAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) {
    juce::ScopedNoDenormals noDenormals;
    const int numSamples = buffer.getNumSamples();
    buffer.clear();

    keyboardState.processNextMidiBuffer(midiMessages, 0, numSamples, true);

    omnifon::DawSyncInfo sync;
    sync.enabled = apvts.getRawParameterValue("daw_sync")->load() >= 0.5f;
    sync.divisionIndex = static_cast<int>(std::round(apvts.getRawParameterValue("daw_div")->load()));
    sync.followTransport = apvts.getRawParameterValue("daw_transport")->load() >= 0.5f;

    if (auto* playHead = getPlayHead()) {
        if (auto pos = playHead->getPosition()) {
            if (auto bpm = pos->getBpm()) sync.bpm = *bpm;
            sync.isPlaying = pos->getIsPlaying();
            if (auto ppq = pos->getPpqPosition()) {
                sync.hasPpq = true;
                sync.ppqPosition = *ppq;
            }
        }
    }
    liveHostBpm.store(sync.bpm, std::memory_order_relaxed);
    liveDawPlaying.store(sync.isPlaying, std::memory_order_relaxed);

    const juce::SpinLock::ScopedTryLockType sl(patchLock);
    if (!sl.isLocked()) return;

    syncParamsToRack();

    if (rack.pulsador.syncBlockStart(sync)) {
        rack.secuenciador.reset();
    }

    auto* outL = buffer.getWritePointer(0);
    auto* outR = buffer.getNumChannels() > 1 ? buffer.getWritePointer(1) : nullptr;

    auto midiIt = midiMessages.cbegin();
    int wPos = scopeWritePos.load(std::memory_order_relaxed);

    for (int i = 0; i < numSamples; ++i) {
        while (midiIt != midiMessages.cend() && (*midiIt).samplePosition <= i) {
            const auto msg = (*midiIt).getMessage();
            if (msg.isNoteOn()) rack.teclado.noteOn(msg.getNoteNumber());
            else if (msg.isNoteOff()) rack.teclado.noteOff(msg.getNoteNumber());
            else if (msg.isAllNotesOff() || msg.isAllSoundOff()) rack.teclado.allOff();
            ++midiIt;
        }

        float l = 0.0f, r = 0.0f;
        rack.processSample(sync, l, r);
        outL[i] = l;
        if (outR) outR[i] = r;

        if ((i & 1) == 0) {
            scopeBuffer[static_cast<size_t>(wPos)] = 0.5f * (l + r);
            wPos = (wPos + 1) % kScopeSize;
        }
    }

    scopeWritePos.store(wPos, std::memory_order_relaxed);
    liveSeqStep.store(rack.secuenciador.step, std::memory_order_relaxed);
}

void OmnifonAudioProcessor::getStateInformation(juce::MemoryBlock& destData) {
    auto state = apvts.copyState();
    state.setProperty("patchIndex", currentPatchIndex.load(), nullptr);

    // Serialize cables
    juce::String cableStr;
    {
        const juce::SpinLock::ScopedLockType sl(patchLock);
        for (const auto& c : activeCables) {
            cableStr += juce::String(static_cast<int>(c.from)) + ":" + juce::String(static_cast<int>(c.to)) + ",";
        }
    }
    state.setProperty("cables", cableStr, nullptr);

    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void OmnifonAudioProcessor::setStateInformation(const void* data, int sizeInBytes) {
    std::unique_ptr<juce::XmlElement> xmlState(getXmlFromBinary(data, sizeInBytes));
    if (xmlState && xmlState->hasTagName(apvts.state.getType())) {
        auto tree = juce::ValueTree::fromXml(*xmlState);
        int idx = static_cast<int>(tree.getProperty("patchIndex", 0));
        if (idx >= 0 && idx < static_cast<int>(factoryPatches.size())) {
            const juce::SpinLock::ScopedLockType sl(patchLock);
            rack.applyPatch(factoryPatches[static_cast<size_t>(idx)]);
            currentPatchIndex.store(idx);
        }
        juce::String cableStr = tree.getProperty("cables", "").toString();
        if (cableStr.isNotEmpty()) {
            std::vector<omnifon::Cable> loaded;
            for (const auto& pair : juce::StringArray::fromTokens(cableStr, ",", "")) {
                auto parts = juce::StringArray::fromTokens(pair, ":", "");
                if (parts.size() == 2) {
                    loaded.push_back({
                        static_cast<omnifon::OutPin>(parts[0].getIntValue()),
                        static_cast<omnifon::InPin>(parts[1].getIntValue())
                    });
                }
            }
            const juce::SpinLock::ScopedLockType sl(patchLock);
            activeCables = loaded;
            rack.setCables(activeCables);
        }
        apvts.replaceState(tree);
    }
}

juce::AudioProcessorEditor* OmnifonAudioProcessor::createEditor() {
    return new OmnifonAudioProcessorEditor(*this);
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() {
    return new OmnifonAudioProcessor();
}
