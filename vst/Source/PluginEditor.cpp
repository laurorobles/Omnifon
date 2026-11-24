#include "PluginEditor.h"
#include "BinaryData.h"
#include <unordered_map>

namespace {

juce::String getMimeType(const juce::String& path) {
    if (path.endsWithIgnoreCase(".html")) return "text/html; charset=utf-8";
    if (path.endsWithIgnoreCase(".js"))   return "application/javascript; charset=utf-8";
    if (path.endsWithIgnoreCase(".css"))  return "text/css; charset=utf-8";
    if (path.endsWithIgnoreCase(".jpg") || path.endsWithIgnoreCase(".jpeg")) return "image/jpeg";
    if (path.endsWithIgnoreCase(".png"))  return "image/png";
    if (path.endsWithIgnoreCase(".svg"))  return "image/svg+xml";
    return "application/octet-stream";
}

std::optional<juce::WebBrowserComponent::Resource> serveFromZip(const juce::String& urlPath) {
    juce::String clean = urlPath;
    if (clean.startsWithChar('/')) clean = clean.substring(1);
    if (clean.isEmpty()) clean = "index.html";

    juce::MemoryInputStream mis(BinaryData::WebUI_zip, BinaryData::WebUI_zipSize, false);
    juce::ZipFile zip(mis);
    const int idx = zip.getIndexOfFileName(clean, true);
    if (idx < 0) return std::nullopt;

    std::unique_ptr<juce::InputStream> stream(zip.createStreamForEntry(idx));
    if (!stream) return std::nullopt;

    juce::MemoryBlock mb;
    stream->readIntoMemoryBlock(mb);
    std::vector<std::byte> bytes(mb.getSize());
    if (mb.getSize() > 0) {
        std::memcpy(bytes.data(), mb.getData(), mb.getSize());
    }
    return juce::WebBrowserComponent::Resource { std::move(bytes), getMimeType(clean) };
}

} // namespace

omnifon::OutPin OmnifonAudioProcessorEditor::parseOutPin(const juce::String& spec) {
    static const std::unordered_map<std::string, omnifon::OutPin> map = {
        { "envolvedor.s1", omnifon::OUT_ENV_S1 }, { "envolvedor.s2", omnifon::OUT_ENV_S2 },
        { "aleator.esc", omnifon::OUT_ALE_ESC }, { "aleator.suave", omnifon::OUT_ALE_SUAVE },
        { "anillo.sal", omnifon::OUT_ANI_SAL1 }, { "anillo.sal2", omnifon::OUT_ANI_SAL2 },
        { "ruidor.blanco", omnifon::OUT_RUI_BLANCO }, { "ruidor.rosa", omnifon::OUT_RUI_ROSA },
        { "reverberal.sal", omnifon::OUT_REV_SAL1 }, { "reverberal.sal2", omnifon::OUT_REV_SAL2 },
        { "integrador.sal", omnifon::OUT_INT_SAL1 }, { "integrador.sal2", omnifon::OUT_INT_SAL2 },
        { "integrador.pulsoSal", omnifon::OUT_INT_PULSO },
        { "osc1.sen", omnifon::OUT_OSC1_SEN }, { "osc1.tri", omnifon::OUT_OSC1_TRI },
        { "osc1.rampa", omnifon::OUT_OSC1_RAMPA }, { "osc1.cuad", omnifon::OUT_OSC1_CUAD },
        { "osc2.sen", omnifon::OUT_OSC2_SEN }, { "osc2.tri", omnifon::OUT_OSC2_TRI },
        { "osc2.rampa", omnifon::OUT_OSC2_RAMPA }, { "osc2.cuad", omnifon::OUT_OSC2_CUAD },
        { "filtrov.bajos", omnifon::OUT_FIV_BAJOS }, { "filtrov.altos", omnifon::OUT_FIV_ALTOS },
        { "filtrov.banda", omnifon::OUT_FIV_BANDA },
        { "filtroo.suma", omnifon::OUT_FIO_SUMA },
        { "filtroo.b0", omnifon::OUT_FIO_B0 }, { "filtroo.b1", omnifon::OUT_FIO_B1 },
        { "filtroo.b2", omnifon::OUT_FIO_B2 }, { "filtroo.b3", omnifon::OUT_FIO_B3 },
        { "filtroo.b4", omnifon::OUT_FIO_B4 }, { "filtroo.b5", omnifon::OUT_FIO_B5 },
        { "filtroo.b6", omnifon::OUT_FIO_B6 }, { "filtroo.b7", omnifon::OUT_FIO_B7 },
        { "filtroo.b8", omnifon::OUT_FIO_B8 }, { "filtroo.b9", omnifon::OUT_FIO_B9 },
        { "pulsador.pulsos", omnifon::OUT_PUL_1 }, { "pulsador.pulsos2", omnifon::OUT_PUL_2 },
        { "pulsador.inv", omnifon::OUT_PUL_INV },
        { "secuenciador.pulsoSal", omnifon::OUT_SEQ_PULSO },
        { "secuenciador.a", omnifon::OUT_SEQ_A }, { "secuenciador.b", omnifon::OUT_SEQ_B },
        { "secuenciador.c", omnifon::OUT_SEQ_C }, { "secuenciador.volt", omnifon::OUT_SEQ_VOLT },
        { "secuenciador.st0", omnifon::OUT_SEQ_ST0 }, { "secuenciador.st1", omnifon::OUT_SEQ_ST1 },
        { "secuenciador.st2", omnifon::OUT_SEQ_ST2 }, { "secuenciador.st3", omnifon::OUT_SEQ_ST3 },
        { "secuenciador.st4", omnifon::OUT_SEQ_ST4 }, { "secuenciador.st5", omnifon::OUT_SEQ_ST5 },
        { "secuenciador.st6", omnifon::OUT_SEQ_ST6 }, { "secuenciador.st7", omnifon::OUT_SEQ_ST7 },
        { "secuenciador.st8", omnifon::OUT_SEQ_ST8 }, { "secuenciador.st9", omnifon::OUT_SEQ_ST9 },
        { "teclado.volt", omnifon::OUT_TEC_VOLT }, { "teclado.pulso", omnifon::OUT_TEC_PULSO },
    };
    const auto it = map.find(spec.toStdString());
    return it != map.end() ? it->second : omnifon::OUT_NONE;
}

omnifon::InPin OmnifonAudioProcessorEditor::parseInPin(const juce::String& spec) {
    static const std::unordered_map<std::string, omnifon::InPin> map = {
        { "envolvedor.entrada", omnifon::IN_ENV_ENTRADA }, { "envolvedor.control", omnifon::IN_ENV_CONTROL },
        { "aleator.pulso", omnifon::IN_ALE_PULSO },
        { "anillo.a", omnifon::IN_ANI_A }, { "anillo.b", omnifon::IN_ANI_B }, { "anillo.mod", omnifon::IN_ANI_MOD },
        { "reverberal.e1", omnifon::IN_REV_E1 }, { "reverberal.e2", omnifon::IN_REV_E2 },
        { "integrador.pulso", omnifon::IN_INT_PULSO },
        { "osc1.frec", omnifon::IN_OSC1_FREC }, { "osc1.mod", omnifon::IN_OSC1_MOD },
        { "osc2.frec", omnifon::IN_OSC2_FREC }, { "osc2.mod", omnifon::IN_OSC2_MOD },
        { "filtrov.entrada", omnifon::IN_FIV_ENTRADA }, { "filtrov.anchoCv", omnifon::IN_FIV_ANCHO_CV },
        { "filtrov.control", omnifon::IN_FIV_CONTROL }, { "filtrov.mod", omnifon::IN_FIV_MOD },
        { "filtroo.entrada", omnifon::IN_FIO_ENTRADA },
        { "pulsador.inicio", omnifon::IN_PUL_INICIO }, { "pulsador.fin", omnifon::IN_PUL_FIN },
        { "pulsador.anchoCv", omnifon::IN_PUL_ANCHO_CV }, { "pulsador.relojCv", omnifon::IN_PUL_RELOJ_CV },
        { "secuenciador.pulso", omnifon::IN_SEQ_PULSO }, { "secuenciador.reinicio", omnifon::IN_SEQ_REINICIO },
        { "salida.izq", omnifon::IN_SAL_IZQ }, { "salida.der", omnifon::IN_SAL_DER },
    };
    const auto it = map.find(spec.toStdString());
    return it != map.end() ? it->second : omnifon::NUM_IN_PINS;
}

OmnifonAudioProcessorEditor::OmnifonAudioProcessorEditor(OmnifonAudioProcessor& p)
    : AudioProcessorEditor(&p), audioProcessor(p) {
    auto options = juce::WebBrowserComponent::Options {}
        .withNativeIntegrationEnabled()
#if JUCE_WINDOWS
        .withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
        .withWinWebView2Options(juce::WebBrowserComponent::Options::WinWebView2 {}
            .withUserDataFolder([] {
                auto dir = juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory)
                               .getChildFile("Extasis Records")
                               .getChildFile("Omnifon")
                               .getChildFile("WebView2");
                dir.createDirectory();
                return dir;
            }()))
#endif
        .withResourceProvider([](const juce::String& url) { return serveFromZip(url); })
        .withNativeFunction("omnifon", [this](const juce::Array<juce::var>& args,
                                              juce::WebBrowserComponent::NativeFunctionCompletion complete) {
            if (args.size() >= 2) {
                handleNativeCall(args[0].toString(), args[1].toString());
            }
            complete({});
        });

    webView = std::make_unique<juce::WebBrowserComponent>(options);
    addAndMakeVisible(*webView);
    webView->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());

    setResizable(true, true);
    setResizeLimits(960, 620, 1600, 1100);
    setSize(kWidth, kHeightWithKb);
    startTimerHz(30);
}

void OmnifonAudioProcessorEditor::resized() {
    if (webView) webView->setBounds(getLocalBounds());
}

void OmnifonAudioProcessorEditor::handleNativeCall(const juce::String& action, const juce::String& jsonPayload) {
    uiReady = true;
    const auto data = juce::JSON::parse(jsonPayload);
    auto setApvts = [this](const char* id, float val) {
        if (auto* param = audioProcessor.apvts.getParameter(id)) {
            param->setValueNotifyingHost(param->convertTo0to1(val));
        }
    };

    if (action == "setParam") {
        const auto mod = data["mod"].toString();
        const auto id  = data["id"].toString();
        const float v  = static_cast<float>(data["v"]);

        if (mod == "envolvedor") {
            if (id == "nivel") setApvts("env_nivel", v);
            else if (id == "mod") setApvts("env_mod", v);
        } else if (mod == "anillo" && id == "nivel") {
            setApvts("anillo_nivel", v);
        } else if (mod == "reverberal") {
            if (id == "intensidad") setApvts("rev_int", v);
            else if (id == "tiempo") setApvts("rev_tiempo", v);
        } else if (mod == "integrador") {
            if (id == "ataque") setApvts("int_ataque", v);
            else if (id == "duracion") setApvts("int_duracion", v);
            else if (id == "decaimiento") setApvts("int_decaimiento", v);
            else if (id == "modo") audioProcessor.setIntegradorAutoCycle(v >= 0.5f);
        } else if (mod == "osc1") {
            if (id == "frecuencia") setApvts("osc1_freq", v);
            else if (id == "modulador") setApvts("osc1_mod", v);
            else if (id == "ancho") setApvts("osc1_ancho", v);
        } else if (mod == "osc2") {
            if (id == "frecuencia") setApvts("osc2_freq", v);
            else if (id == "modulador") setApvts("osc2_mod", v);
        } else if (mod == "filtrov") {
            if (id == "centro") setApvts("fiv_centro", v);
            else if (id == "ancho") setApvts("fiv_ancho", v);
            else if (id == "modulacion") setApvts("fiv_mod", v);
        } else if (mod == "filtroo") {
            if (id == "corte") audioProcessor.setFiltroOCorte(v);
            else if (id == "suma") audioProcessor.setFiltroOSuma(v);
            else if (id.startsWith("g")) audioProcessor.setFiltroOBand(id.substring(1).getIntValue(), v);
        } else if (mod == "pulsador") {
            if (id == "reloj") setApvts("pul_reloj", v);
            else if (id == "ancho") setApvts("pul_ancho", v);
        } else if (mod == "secuenciador") {
            if (id.startsWith("sw")) audioProcessor.setSeqSwitch(id.substring(2).getIntValue(), v >= 0.5f);
            else if (id.startsWith("s")) audioProcessor.setSeqKnob(id.substring(1).getIntValue(), v);
        } else if (mod == "teclado" && id == "portamento") {
            setApvts("tec_portamento", v);
        } else if (mod == "salida" && id == "volumen") {
            setApvts("sal_volumen", v);
        }
    } else if (action == "connect") {
        const auto from = parseOutPin(data["from"].toString());
        const auto to   = parseInPin(data["to"].toString());
        if (from != omnifon::OUT_NONE && to < omnifon::NUM_IN_PINS) {
            audioProcessor.connectCable(from, to);
        }
    } else if (action == "disconnect") {
        const auto to = parseInPin(data["to"].toString());
        if (to < omnifon::NUM_IN_PINS) audioProcessor.disconnectInput(to);
    } else if (action == "clearCables") {
        audioProcessor.clearAllCables();
    } else if (action == "loadPatch") {
        audioProcessor.loadFactoryPatch(static_cast<int>(data["index"]));
    } else if (action == "noteOn") {
        audioProcessor.keyboardState.noteOn(1, static_cast<int>(data["note"]), 1.0f);
    } else if (action == "noteOff") {
        audioProcessor.keyboardState.noteOff(1, static_cast<int>(data["note"]), 0.0f);
    } else if (action == "trigger") {
        const auto mod = data["mod"].toString();
        const auto act = data["action"].toString();
        const bool down = static_cast<bool>(data["down"]);
        if (mod == "integrador" && act == "manual") audioProcessor.setIntegradorManual(down);
        else if (mod == "pulsador" && down) audioProcessor.triggerPulsador(act == "start");
    } else if (action == "dawSync") {
        setApvts("daw_sync", static_cast<bool>(data["enabled"]) ? 1.0f : 0.0f);
    } else if (action == "dawDiv") {
        setApvts("daw_div", static_cast<float>(data["index"]));
    } else if (action == "dawTransport") {
        setApvts("daw_transport", static_cast<bool>(data["enabled"]) ? 1.0f : 0.0f);
    } else if (action == "toggleKeyboard") {
        const bool visible = static_cast<bool>(data["visible"]);
        setSize(getWidth(), visible ? kHeightWithKb : kHeightNoKb);
    } else if (action == "openUrl") {
        juce::URL(data["url"].toString()).launchInDefaultBrowser();
    }
}

void OmnifonAudioProcessorEditor::timerCallback() {
    if (!webView || !uiReady) return;

    const int step = audioProcessor.liveSeqStep.load(std::memory_order_relaxed);
    const double bpm = audioProcessor.liveHostBpm.load(std::memory_order_relaxed);
    const bool playing = audioProcessor.liveDawPlaying.load(std::memory_order_relaxed);

    // Send 128 scope samples for smooth 30fps CRT phosphor waveform
    const int n = OmnifonAudioProcessor::kScopeSize;
    const int start = audioProcessor.scopeWritePos.load(std::memory_order_relaxed);
    juce::String arr = "[";
    for (int i = 0; i < 128; ++i) {
        const float v = audioProcessor.scopeBuffer[static_cast<size_t>((start + i * 4) % n)];
        arr += juce::String(v, 3);
        if (i < 127) arr += ",";
    }
    arr += "]";

    const juce::String js = "window.__omnifonFromHost && window.__omnifonFromHost({step:"
        + juce::String(step) + ",bpm:" + juce::String(bpm, 1)
        + ",playing:" + (playing ? "true" : "false")
        + ",scope:" + arr + "});";
    webView->evaluateJavascript(js);
}
