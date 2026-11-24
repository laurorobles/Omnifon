#include "PluginEditor.h"

void OmnifonLookAndFeel::drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                                          float sliderPos, float rotaryStartAngle,
                                          float rotaryEndAngle, juce::Slider& slider) {
    const float radius = static_cast<float>(juce::jmin(width, height)) * 0.43f;
    const float cx = static_cast<float>(x) + static_cast<float>(width) * 0.5f;
    const float cy = static_cast<float>(y) + static_cast<float>(height) * 0.5f;
    const float angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    const bool isWhite = slider.getProperties().getWithDefault("whiteKnob", false);

    g.setColour(juce::Colours::black.withAlpha(0.28f));
    g.fillEllipse(cx - radius + 1.2f, cy - radius + 2.0f, radius * 2.0f, radius * 2.0f);

    const juce::Colour bodyCol = isWhite ? juce::Colour(0xfff1eee4) : juce::Colour(0xff232220);
    const juce::Colour rimCol  = isWhite ? juce::Colour(0xffcbc6b8) : juce::Colour(0xff141312);
    g.setColour(rimCol);
    g.fillEllipse(cx - radius, cy - radius, radius * 2.0f, radius * 2.0f);

    const float innerR = radius * 0.82f;
    g.setColour(bodyCol);
    g.fillEllipse(cx - innerR, cy - innerR, innerR * 2.0f, innerR * 2.0f);

    juce::Path p;
    const float ptrLen = innerR * 0.72f;
    const float ptrThick = radius > 16.0f ? 2.4f : 1.8f;
    p.addRoundedRectangle(-ptrThick * 0.5f, -innerR * 0.88f, ptrThick, ptrLen, 1.0f);
    p.applyTransform(juce::AffineTransform::rotation(angle).translated(cx, cy));
    g.setColour(isWhite ? juce::Colour(0xff1a1917) : juce::Colour(0xfff2efe6));
    g.fillPath(p);
}

void OscilloscopeView::paint(juce::Graphics& g) {
    auto b = getLocalBounds().toFloat();
    g.setColour(juce::Colour(0xff0d1912));
    g.fillRoundedRectangle(b, 5.0f);
    g.setColour(juce::Colour(0xff2c3d32));
    g.drawRoundedRectangle(b, 5.0f, 1.5f);

    g.setColour(juce::Colour(0xff1d3a28));
    g.drawHorizontalLine(static_cast<int>(b.getCentreY()), b.getX() + 2.0f, b.getRight() - 2.0f);

    const int n = OmnifonAudioProcessor::kScopeSize;
    const int start = processor.scopeWritePos.load(std::memory_order_relaxed);
    juce::Path wave;
    for (int i = 0; i < n; ++i) {
        const float v = processor.scopeBuffer[static_cast<size_t>((start + i) % n)];
        const float px = b.getX() + 4.0f + (b.getWidth() - 8.0f) * (static_cast<float>(i) / static_cast<float>(n - 1));
        const float py = b.getCentreY() - juce::jlimit(-1.0f, 1.0f, v) * (b.getHeight() * 0.42f);
        if (i == 0) wave.startNewSubPath(px, py);
        else wave.lineTo(px, py);
    }
    g.setColour(juce::Colour(0xff52ff8b));
    g.strokePath(wave, juce::PathStrokeType(1.5f));
}

// ── CableLayerComponent
CableLayerComponent::CableLayerComponent(OmnifonAudioProcessor& p, const std::vector<JackSocket>& j)
    : processor(p), jacks(j) {
    setInterceptsMouseClicks(true, false);
}

const JackSocket* CableLayerComponent::findJackAt(juce::Point<float> pt, float maxDist) const {
    for (const auto& j : jacks) {
        if (j.center.getDistanceFrom(pt) <= maxDist) return &j;
    }
    return nullptr;
}

juce::Point<float> CableLayerComponent::findOutCenter(omnifon::OutPin pin) const {
    for (const auto& j : jacks)
        if (!j.isInput && j.pinId == static_cast<int>(pin)) return j.center;
    return {};
}

juce::Point<float> CableLayerComponent::findInCenter(omnifon::InPin pin) const {
    for (const auto& j : jacks)
        if (j.isInput && j.pinId == static_cast<int>(pin)) return j.center;
    return {};
}

bool CableLayerComponent::hitTest(int x, int y) {
    return dragging || findJackAt({ static_cast<float>(x), static_cast<float>(y) }, 11.0f) != nullptr;
}

void CableLayerComponent::mouseDown(const juce::MouseEvent& e) {
    const auto pt = e.position;
    if (const auto* j = findJackAt(pt)) {
        if (j->isInput) {
            // Check if this input already has a cable: unplug it and drag its free end!
            auto cables = processor.getCables();
            for (const auto& c : cables) {
                if (static_cast<int>(c.to) == j->pinId) {
                    processor.disconnectInput(c.to);
                    dragging = true;
                    dragFromInput = false;
                    dragPinId = static_cast<int>(c.from);
                    dragStart = findOutCenter(c.from);
                    dragCurrent = pt;
                    repaint();
                    return;
                }
            }
        }
        dragging = true;
        dragFromInput = j->isInput;
        dragPinId = j->pinId;
        dragStart = j->center;
        dragCurrent = pt;
        repaint();
    }
}

void CableLayerComponent::mouseDrag(const juce::MouseEvent& e) {
    if (!dragging) return;
    dragCurrent = e.position;
    repaint();
}

void CableLayerComponent::mouseUp(const juce::MouseEvent& e) {
    if (!dragging) return;
    if (const auto* target = findJackAt(e.position, 14.0f)) {
        if (target->isInput != dragFromInput) {
            const auto outPin = static_cast<omnifon::OutPin>(dragFromInput ? target->pinId : dragPinId);
            const auto inPin  = static_cast<omnifon::InPin>(dragFromInput ? dragPinId : target->pinId);
            processor.connectCable(outPin, inPin);
        }
    }
    dragging = false;
    repaint();
}

void CableLayerComponent::paint(juce::Graphics& g) {
    const float alpha = isFaded ? 0.24f : 0.88f;
    auto drawWire = [&](juce::Point<float> a, juce::Point<float> b, juce::Colour col) {
        const float dist = a.getDistanceFrom(b);
        const float sag = juce::jmin(120.0f, 24.0f + dist * 0.22f);
        juce::Path path;
        path.startNewSubPath(a);
        path.cubicTo(a.x, a.y + sag, b.x, b.y + sag, b.x, b.y);

        g.setColour(juce::Colours::black.withAlpha(alpha * 0.35f));
        g.strokePath(path, juce::PathStrokeType(4.5f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded),
                     juce::AffineTransform::translation(0.0f, 3.0f));
        g.setColour(col.withAlpha(alpha));
        g.strokePath(path, juce::PathStrokeType(3.2f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    };

    const auto cables = processor.getCables();
    for (size_t i = 0; i < cables.size(); ++i) {
        const auto a = findOutCenter(cables[i].from);
        const auto b = findInCenter(cables[i].to);
        if (a.isOrigin() || b.isOrigin()) continue;
        const juce::Colour col = (i % 3 == 0) ? juce::Colour(0xff9c9990)
                               : (i % 3 == 1) ? juce::Colour(0xff7d7a72)
                                              : juce::Colour(0xff52504c);
        drawWire(a, b, col);
    }

    if (dragging) {
        drawWire(dragStart, dragCurrent, juce::Colour(0xffd97a36));
    }
}

// ── OmnifonAudioProcessorEditor
OmnifonAudioProcessorEditor::OmnifonAudioProcessorEditor(OmnifonAudioProcessor& p)
    : AudioProcessorEditor(&p),
      audioProcessor(p),
      scope(p),
      keyboard(p.keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard) {
    setLookAndFeel(&lnf);

    // ── Top Bar
    const auto& patches = audioProcessor.getPatches();
    for (size_t i = 0; i < patches.size(); ++i)
        patchBox.addItem(juce::String::fromUTF8(patches[i].name), static_cast<int>(i) + 1);
    patchBox.setSelectedId(audioProcessor.getCurrentProgram() + 1, juce::dontSendNotification);
    patchBox.onChange = [this] {
        const int idx = patchBox.getSelectedId() - 1;
        if (idx >= 0) {
            audioProcessor.loadFactoryPatch(idx);
            syncNonApvtsControlsFromProcessor();
            if (cableLayer) cableLayer->repaint();
        }
    };
    addAndMakeVisible(patchBox);

    dawSyncBtn.setColour(juce::ToggleButton::textColourId, juce::Colour(0xffece8da));
    dawSyncBtn.setColour(juce::ToggleButton::tickColourId, juce::Colour(0xffff5252));
    addAndMakeVisible(dawSyncBtn);
    dawSyncAtt = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment>(
        audioProcessor.apvts, "daw_sync", dawSyncBtn);

    dawDivBox.addItemList({ "1/1", "1/2", "1/4", "1/8", "1/8T", "1/16", "1/16T", "1/32" }, 1);
    addAndMakeVisible(dawDivBox);
    dawDivAtt = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(
        audioProcessor.apvts, "daw_div", dawDivBox);

    dawTransportBtn.setColour(juce::ToggleButton::textColourId, juce::Colour(0xffece8da));
    dawTransportBtn.setColour(juce::ToggleButton::tickColourId, juce::Colour(0xff52ff8b));
    addAndMakeVisible(dawTransportBtn);
    dawTransportAtt = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment>(
        audioProcessor.apvts, "daw_transport", dawTransportBtn);

    dimCablesBtn.setClickingTogglesState(true);
    dimCablesBtn.onClick = [this] {
        if (cableLayer) cableLayer->setFaded(dimCablesBtn.getToggleState());
    };
    addAndMakeVisible(dimCablesBtn);

    clearCablesBtn.onClick = [this] {
        audioProcessor.clearAllCables();
        if (cableLayer) cableLayer->repaint();
    };
    addAndMakeVisible(clearCablesBtn);

    toggleKbBtn.setClickingTogglesState(true);
    toggleKbBtn.setToggleState(true, juce::dontSendNotification);
    toggleKbBtn.onClick = [this] {
        showKeyboard = toggleKbBtn.getToggleState();
        updateWindowHeight();
    };
    addAndMakeVisible(toggleKbBtn);

    bpmLabel.setJustificationType(juce::Justification::centredRight);
    bpmLabel.setColour(juce::Label::textColourId, juce::Colour(0xfff3ead3));
    bpmLabel.setFont(juce::FontOptions(12.5f, juce::Font::bold));
    bpmLabel.setText("120.0 BPM", juce::dontSendNotification);
    addAndMakeVisible(bpmLabel);

    // ── APVTS Knobs
    kEnvNivel    = addKnob("env_nivel",       "Ent 1",      false, false);
    kEnvMod      = addKnob("env_mod",         "Ent 2",      false, false);
    kAnilloNivel = addKnob("anillo_nivel",    "Nivel",      false, false);
    kRevInt      = addKnob("rev_int",         "Intensid.",  false, false);
    kRevTiempo   = addKnob("rev_tiempo",      "tiempo",     false, false);

    kIntAtaque   = addKnob("int_ataque",      "ataque",     false, false);
    kIntDur      = addKnob("int_duracion",    "duracion",   false, false);
    kIntDec      = addKnob("int_decaimiento", "decaim.",    false, false);

    kOsc1Freq    = addKnob("osc1_freq",       "frecuencia", true,  true);
    kOsc1Mod     = addKnob("osc1_mod",        "mod. frec.", true,  false);
    kOsc1Ancho   = addKnob("osc1_ancho",      "ancho",      false, false);

    kOsc2Freq    = addKnob("osc2_freq",       "frecuencia", true,  true);
    kOsc2Mod     = addKnob("osc2_mod",        "mod. frec.", true,  false);

    kFivCentro   = addKnob("fiv_centro",      "Centro",     true,  true);
    kFivAncho    = addKnob("fiv_ancho",       "ancho",      false, false);
    kFivMod      = addKnob("fiv_mod",         "mod.",       false, false);

    kPulReloj    = addKnob("pul_reloj",       "reloj",      true,  true);
    kPulAncho    = addKnob("pul_ancho",       "Pulsos",     false, false);

    kTecPort     = addKnob("tec_portamento",  "Portamento", false, false);
    kSalVol      = addKnob("sal_volumen",     "Volumen",    false, false);

    // ── Integrador & Pulsador buttons
    intAutoBtn.setColour(juce::ToggleButton::textColourId, juce::Colour(0xff1a1917));
    intAutoBtn.onClick = [this] { audioProcessor.setIntegradorAutoCycle(intAutoBtn.getToggleState()); };
    addAndMakeVisible(intAutoBtn);

    intTrigBtn.onStateChange = [this] { audioProcessor.setIntegradorManual(intTrigBtn.isDown()); };
    addAndMakeVisible(intTrigBtn);

    pulStartBtn.onClick = [this] { audioProcessor.triggerPulsador(true); };
    pulStopBtn.onClick  = [this] { audioProcessor.triggerPulsador(false); };
    addAndMakeVisible(pulStartBtn);
    addAndMakeVisible(pulStopBtn);

    // ── Filtro-O Sliders
    fioCorteSlider.setSliderStyle(juce::Slider::LinearVertical);
    fioCorteSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    fioCorteSlider.setRange(0.0, 1.0, 0.01);
    fioCorteSlider.onValueChange = [this] { audioProcessor.setFiltroOCorte(static_cast<float>(fioCorteSlider.getValue())); };
    addAndMakeVisible(fioCorteSlider);

    fioSumaSlider.setSliderStyle(juce::Slider::LinearHorizontal);
    fioSumaSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    fioSumaSlider.setRange(0.0, 1.0, 0.01);
    fioSumaSlider.onValueChange = [this] { audioProcessor.setFiltroOSuma(static_cast<float>(fioSumaSlider.getValue())); };
    addAndMakeVisible(fioSumaSlider);

    for (size_t b = 0; b < 10; ++b) {
        fioBandSliders[b].setSliderStyle(juce::Slider::LinearHorizontal);
        fioBandSliders[b].setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
        fioBandSliders[b].setRange(0.0, 1.0, 0.01);
        fioBandSliders[b].onValueChange = [this, b] {
            audioProcessor.setFiltroOBand(static_cast<int>(b), static_cast<float>(fioBandSliders[b].getValue()));
        };
        addAndMakeVisible(fioBandSliders[b]);
    }

    // ── Sequencer 3x10 Knobs + 10 Step Switches
    for (size_t i = 0; i < 30; ++i) {
        seqKnobs[i].setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
        seqKnobs[i].setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
        seqKnobs[i].setRange(0.0, 1.0, 0.005);
        seqKnobs[i].onValueChange = [this, i] {
            audioProcessor.setSeqKnob(static_cast<int>(i), static_cast<float>(seqKnobs[i].getValue()));
        };
        addAndMakeVisible(seqKnobs[i]);
    }
    for (size_t s = 0; s < 10; ++s) {
        seqSwitches[s].setButtonText("");
        seqSwitches[s].setColour(juce::ToggleButton::tickColourId, juce::Colour(0xff1a1917));
        seqSwitches[s].onClick = [this, s] {
            audioProcessor.setSeqSwitch(static_cast<int>(s), seqSwitches[s].getToggleState());
        };
        addAndMakeVisible(seqSwitches[s]);
    }

    addAndMakeVisible(scope);
    keyboard.setAvailableRange(36, 96);
    addAndMakeVisible(keyboard);

    // ── Build Jack Socket coordinates (14 modules)
    auto addIn  = [&](omnifon::InPin pin, float x, float y, const char* lbl) { jacks.push_back({ true,  static_cast<int>(pin), { x, y }, lbl }); };
    auto addOut = [&](omnifon::OutPin pin, float x, float y, const char* lbl) { jacks.push_back({ false, static_cast<int>(pin), { x, y }, lbl }); };

    // Row 1 (y=56..164, 5 plates of width 222, x: 14, 242, 470, 698, 926)
    addIn (omnifon::IN_ENV_ENTRADA,  34,  96, "E1");
    addIn (omnifon::IN_ENV_CONTROL,  34, 140, "E2");
    addOut(omnifon::OUT_ENV_S1,     214,  96, "S1");
    addOut(omnifon::OUT_ENV_S2,     214, 140, "S2");

    addIn (omnifon::IN_ALE_PULSO,   272, 114, "Ent");
    addOut(omnifon::OUT_ALE_ESC,    438,  96, "Esc");
    addOut(omnifon::OUT_ALE_SUAVE,  438, 140, "Sua");

    addIn (omnifon::IN_ANI_A,       492,  88, "A");
    addIn (omnifon::IN_ANI_B,       492, 116, "B");
    addIn (omnifon::IN_ANI_MOD,     492, 144, "M");
    addOut(omnifon::OUT_ANI_SAL1,   670,  96, "S1");
    addOut(omnifon::OUT_ANI_SAL2,   670, 140, "S2");

    addOut(omnifon::OUT_RUI_BLANCO, 892,  96, "Bl");
    addOut(omnifon::OUT_RUI_ROSA,   892, 140, "Ro");

    addIn (omnifon::IN_REV_E1,      948,  96, "E1");
    addIn (omnifon::IN_REV_E2,      948, 140, "E2");
    addOut(omnifon::OUT_REV_SAL1,  1126,  96, "S1");
    addOut(omnifon::OUT_REV_SAL2,  1126, 140, "S2");

    // Row 2 (y=170..356)
    addIn (omnifon::IN_INT_PULSO,    34, 254, "Pls");
    addOut(omnifon::OUT_INT_SAL1,   214, 212, "Ev1");
    addOut(omnifon::OUT_INT_SAL2,   214, 240, "Ev2");
    addOut(omnifon::OUT_INT_PULSO,  214, 294, "Pls");

    addIn (omnifon::IN_OSC1_FREC,   262, 214, "Fr");
    addIn (omnifon::IN_OSC1_MOD,    262, 326, "FM");
    addOut(omnifon::OUT_OSC1_SEN,   442, 206, "~");
    addOut(omnifon::OUT_OSC1_TRI,   442, 232, "^");
    addOut(omnifon::OUT_OSC1_RAMPA, 442, 258, "/|");
    addOut(omnifon::OUT_OSC1_CUAD,  442, 284, "[]");

    addIn (omnifon::IN_OSC2_FREC,   490, 214, "Fr");
    addIn (omnifon::IN_OSC2_MOD,    490, 326, "FM");
    addOut(omnifon::OUT_OSC2_SEN,   670, 206, "~");
    addOut(omnifon::OUT_OSC2_TRI,   670, 232, "^");
    addOut(omnifon::OUT_OSC2_RAMPA, 670, 258, "/|");
    addOut(omnifon::OUT_OSC2_CUAD,  670, 284, "[]");

    addIn (omnifon::IN_FIV_ENTRADA,  718, 204, "Ent");
    addIn (omnifon::IN_FIV_ANCHO_CV, 718, 236, "Anc");
    addIn (omnifon::IN_FIV_CONTROL,  718, 282, "Cen");
    addIn (omnifon::IN_FIV_MOD,      718, 326, "Mod");
    addOut(omnifon::OUT_FIV_BAJOS,   898, 214, "Baj");
    addOut(omnifon::OUT_FIV_ALTOS,   898, 266, "Alt");
    addOut(omnifon::OUT_FIV_BANDA,   898, 318, "Ban");

    addIn (omnifon::IN_FIO_ENTRADA,  944, 206, "Ent");
    addOut(omnifon::OUT_FIO_SUMA,   1130, 336, "Sum");

    // Row 3 (y=362..562)
    addIn (omnifon::IN_PUL_INICIO,   34, 404, "Ini");
    addIn (omnifon::IN_PUL_FIN,      34, 434, "Fin");
    addIn (omnifon::IN_PUL_ANCHO_CV, 34, 474, "Anc");
    addIn (omnifon::IN_PUL_RELOJ_CV, 34, 524, "Rel");
    addOut(omnifon::OUT_PUL_1,      214, 416, "P1");
    addOut(omnifon::OUT_PUL_2,      214, 456, "P2");
    addOut(omnifon::OUT_PUL_INV,    214, 496, "Inv");

    // Sequencer jacks
    addIn (omnifon::IN_SEQ_PULSO,    266, 402, "Clk");
    addOut(omnifon::OUT_SEQ_PULSO,   294, 402, "Sal");
    addIn (omnifon::IN_SEQ_REINICIO, 322, 402, "Rst");
    addOut(omnifon::OUT_SEQ_A,       266, 444, "F1");
    addOut(omnifon::OUT_SEQ_B,       266, 480, "F2");
    addOut(omnifon::OUT_SEQ_C,       266, 516, "F3");
    addOut(omnifon::OUT_SEQ_VOLT,    266, 544, "V");
    for (int i = 0; i < 10; ++i) {
        addOut(static_cast<omnifon::OutPin>(omnifon::OUT_SEQ_ST0 + i),
               368.0f + static_cast<float>(i) * 80.0f, 402.0f, "");
    }

    // Bottom strip: Teclado & Salida (y=568..668)
    addOut(omnifon::OUT_TEC_VOLT,   196, 608, "V");
    addOut(omnifon::OUT_TEC_PULSO,  196, 640, "P");
    addIn (omnifon::IN_SAL_IZQ,     832, 608, "L");
    addIn (omnifon::IN_SAL_DER,     832, 640, "R");

    // Cable overlay on top of everything
    cableLayer = std::make_unique<CableLayerComponent>(audioProcessor, jacks);
    addAndMakeVisible(*cableLayer);

    syncNonApvtsControlsFromProcessor();
    updateWindowHeight();
    startTimerHz(30);
}

OmnifonAudioProcessorEditor::~OmnifonAudioProcessorEditor() {
    setLookAndFeel(nullptr);
}

void OmnifonAudioProcessorEditor::updateWindowHeight() {
    keyboard.setVisible(showKeyboard);
    setSize(kWidth, showKeyboard ? kHeightWithKb : kHeightNoKb);
}

void OmnifonAudioProcessorEditor::syncNonApvtsControlsFromProcessor() {
    intAutoBtn.setToggleState(audioProcessor.getIntegradorAutoCycle(), juce::dontSendNotification);
    fioCorteSlider.setValue(audioProcessor.getFiltroOCorte(), juce::dontSendNotification);
    fioSumaSlider.setValue(audioProcessor.getFiltroOSuma(), juce::dontSendNotification);
    for (size_t b = 0; b < 10; ++b)
        fioBandSliders[b].setValue(audioProcessor.getFiltroOBand(static_cast<int>(b)), juce::dontSendNotification);
    for (size_t i = 0; i < 30; ++i)
        seqKnobs[i].setValue(audioProcessor.getSeqKnob(static_cast<int>(i)), juce::dontSendNotification);
    for (size_t s = 0; s < 10; ++s)
        seqSwitches[s].setToggleState(audioProcessor.getSeqSwitch(static_cast<int>(s)), juce::dontSendNotification);
}

OmnifonAudioProcessorEditor::KnobControl* OmnifonAudioProcessorEditor::addKnob(
    const juce::String& paramId, const juce::String& title, bool isWhite, bool showText) {
    auto k = std::make_unique<KnobControl>();
    k->slider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    k->slider.setTextBoxStyle(showText ? juce::Slider::TextBoxBelow : juce::Slider::NoTextBox, false, 52, 13);
    k->slider.setColour(juce::Slider::textBoxTextColourId, juce::Colour(0xff22201d));
    k->slider.setColour(juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
    k->slider.getProperties().set("whiteKnob", isWhite);
    addAndMakeVisible(k->slider);

    k->label.setText(title, juce::dontSendNotification);
    k->label.setJustificationType(juce::Justification::centred);
    k->label.setColour(juce::Label::textColourId, juce::Colour(0xff1a1917));
    k->label.setFont(juce::FontOptions(10.0f, juce::Font::bold));
    addAndMakeVisible(k->label);

    k->attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        audioProcessor.apvts, paramId, k->slider);
    auto* ptr = k.get();
    knobs.push_back(std::move(k));
    return ptr;
}

void OmnifonAudioProcessorEditor::timerCallback() {
    const double bpm = audioProcessor.liveHostBpm.load(std::memory_order_relaxed);
    const bool playing = audioProcessor.liveDawPlaying.load(std::memory_order_relaxed);
    bpmLabel.setText(juce::String(bpm, 1) + " BPM" + (playing ? " ●" : ""), juce::dontSendNotification);

    const int st = audioProcessor.liveSeqStep.load(std::memory_order_relaxed);
    if (st != activeStep) {
        activeStep = st;
        repaint(340, 376, 800, 22);
    }
    scope.repaint();
}

void OmnifonAudioProcessorEditor::paint(juce::Graphics& g) {
    g.fillAll(juce::Colour(0xff2f2116));

    // Top Bar
    g.setColour(juce::Colour(0xff22201d));
    g.fillRect(0, 0, getWidth(), 48);

    g.setColour(juce::Colour(0xffece8da));
    g.setFont(juce::FontOptions(18.0f, juce::Font::bold));
    g.drawText("OMNIFON", 14, 5, 130, 22, juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xffb8b2a0));
    g.setFont(juce::FontOptions(10.0f));
    g.drawText("Raul Pavon  |  @laurorobles", 14, 27, 160, 14, juce::Justification::centredLeft);

    auto drawPlate = [&](int x, int y, int w, int h, const juce::String& title) {
        juce::Rectangle<float> r(static_cast<float>(x), static_cast<float>(y),
                                 static_cast<float>(w), static_cast<float>(h));
        g.setColour(juce::Colour(0xffe9e7df));
        g.fillRoundedRectangle(r, 3.5f);
        g.setColour(juce::Colour(0xffa9a69b));
        g.drawRoundedRectangle(r, 3.5f, 1.1f);
        g.setColour(juce::Colour(0xff1a1917));
        g.setFont(juce::FontOptions(10.5f, juce::Font::bold));
        g.drawText(title, x + 6, y + 4, w - 12, 14, juce::Justification::centred);
    };

    // Row 1: 5 modules
    drawPlate(14,  56, 222, 108, "ENVOLVEDOR");
    drawPlate(242, 56, 222, 108, "ALEATOR");
    drawPlate(470, 56, 222, 108, "MOD. ANULAR");
    drawPlate(698, 56, 222, 108, "RUIDOR");
    drawPlate(926, 56, 220, 108, "REVERBERAL");

    // Row 2: 5 modules
    drawPlate(14,  170, 222, 186, "INTEGRADOR ENVOLV.");
    drawPlate(242, 170, 222, 186, "OSCILADOR");
    drawPlate(470, 170, 222, 186, "OSCILADOR");
    drawPlate(698, 170, 222, 186, "FILTRO-V");
    drawPlate(926, 170, 220, 186, "FILTRO-O");

    // Row 3: Pulsador + Secuenciador
    drawPlate(14,  362, 222, 200, "PULSADOR");
    drawPlate(242, 362, 904, 200, "S E C U E N C I A D O R");

    // Bottom strip: Teclado + Info + Salida
    drawPlate(14,  568, 222, 100, "TECLADO");
    drawPlate(810, 568, 336, 100, "SALIDA & OSCILOSCOPIO");

    // Sequencer 10 red LEDs
    for (int i = 0; i < 10; ++i) {
        const float lx = 363.0f + static_cast<float>(i) * 80.0f;
        const bool on = (i == activeStep);
        g.setColour(on ? juce::Colour(0xffff3b30) : juce::Colour(0xff4a201d));
        g.fillEllipse(lx, 382.0f, 10.0f, 10.0f);
    }

    // Draw all Jack Sockets
    for (const auto& j : jacks) {
        g.setColour(juce::Colour(0xff383633));
        g.fillEllipse(j.center.x - 6.5f, j.center.y - 6.5f, 13.0f, 13.0f);
        g.setColour(juce::Colour(0xffc9c5ba));
        g.drawEllipse(j.center.x - 6.5f, j.center.y - 6.5f, 13.0f, 13.0f, 1.4f);
        g.setColour(juce::Colours::black);
        g.fillEllipse(j.center.x - 3.2f, j.center.y - 3.2f, 6.4f, 6.4f);
    }
}

void OmnifonAudioProcessorEditor::resized() {
    // Top bar
    patchBox.setBounds       (182, 10, 148, 28);
    dawSyncBtn.setBounds     (340, 10,  94, 28);
    dawDivBox.setBounds      (436, 10,  68, 28);
    dawTransportBtn.setBounds(510, 10, 100, 28);
    dimCablesBtn.setBounds   (622, 10,  76, 28);
    clearCablesBtn.setBounds (704, 10,  80, 28);
    toggleKbBtn.setBounds    (790, 10,  72, 28);
    bpmLabel.setBounds       (960, 10, 186, 28);

    auto placeKnob = [](KnobControl* k, int x, int y, int w, int h) {
        k->label.setBounds(x, y, w, 12);
        k->slider.setBounds(x, y + 12, w, h - 12);
    };

    // Row 1
    placeKnob(kEnvNivel,     64,  76, 56, 68);
    placeKnob(kEnvMod,      128,  76, 56, 68);
    placeKnob(kAnilloNivel, 550,  82, 62, 70);
    placeKnob(kRevInt,      982,  76, 56, 68);
    placeKnob(kRevTiempo,  1046,  76, 56, 68);

    // Row 2
    placeKnob(kIntAtaque,    82, 192, 52, 52);
    intAutoBtn.setBounds    (142, 206, 52, 22);
    intTrigBtn.setBounds    (142, 234, 52, 22);
    placeKnob(kIntDur,       82, 246, 52, 52);
    placeKnob(kIntDec,       82, 300, 52, 52);

    placeKnob(kOsc1Freq,    286, 194, 72, 82);
    placeKnob(kOsc1Ancho,   366, 208, 56, 60);
    placeKnob(kOsc1Mod,     314, 282, 60, 66);

    placeKnob(kOsc2Freq,    514, 194, 72, 82);
    placeKnob(kOsc2Mod,     542, 282, 60, 66);

    placeKnob(kFivAncho,    746, 192, 54, 58);
    placeKnob(kFivCentro,   742, 256, 68, 78);
    placeKnob(kFivMod,      818, 266, 56, 60);

    // Filtro-O
    fioCorteSlider.setBounds(934, 224, 20, 120);
    for (size_t b = 0; b < 10; ++b)
        fioBandSliders[b].setBounds(962, 192 + static_cast<int>(b) * 14, 152, 14);
    fioSumaSlider.setBounds(962, 334, 146, 16);

    // Row 3: Pulsador
    pulStartBtn.setBounds(52,  394, 54, 22);
    pulStopBtn.setBounds (52,  424, 54, 22);
    placeKnob(kPulAncho,  114, 396, 64, 68);
    placeKnob(kPulReloj,   82, 470, 74, 82);

    // Row 3: Sequencer 3x10 knobs + 10 switches
    for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 10; ++col) {
            const int idx = row * 10 + col;
            seqKnobs[static_cast<size_t>(idx)].setBounds(
                350 + col * 80, 424 + row * 36, 36, 36);
        }
    }
    for (int col = 0; col < 10; ++col) {
        seqSwitches[static_cast<size_t>(col)].setBounds(357 + col * 80, 534, 24, 22);
    }

    // Bottom strip: Teclado & Salida
    placeKnob(kTecPort, 68, 588, 68, 72);
    scope.setBounds(854, 592, 196, 66);
    placeKnob(kSalVol, 1062, 588, 68, 72);

    // Collapsible 5-octave keyboard
    keyboard.setBounds(14, 674, getWidth() - 28, 98);

    // Cable layer covers the entire modular cabinet (same coordinate space as jacks)
    if (cableLayer) cableLayer->setBounds(0, 0, getWidth(), kHeightNoKb);
}
