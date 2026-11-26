#include "PluginEditor.h"
#include "BinaryData.h"
#include <cmath>

// ── OmnifonV2LookAndFeel (Photorealistic PBR Studio Hardware Rendering)
OmnifonV2LookAndFeel::OmnifonV2LookAndFeel() {
    setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff282623));
    setColour(juce::ComboBox::textColourId, juce::Colour(0xfff2ede0));
    setColour(juce::ComboBox::outlineColourId, juce::Colour(0xff5e5a50));
    setColour(juce::PopupMenu::backgroundColourId, juce::Colour(0xff24221f));
    setColour(juce::PopupMenu::textColourId, juce::Colour(0xffece8da));
    setColour(juce::PopupMenu::highlightedBackgroundColourId, juce::Colour(0xff4c3828));
    generatePbrAssets();
}

void OmnifonV2LookAndFeel::generatePbrAssets() {
    // 1. Load Photorealistic Studio-Lit Empty Cabinet Faceplate from BinaryData
    faceplateImg = juce::ImageCache::getFromMemory(
        BinaryData::faceplate_clean_jpg, BinaryData::faceplate_clean_jpgSize);

    // Helper: load studio macro knob JPEG on pure white background, crop tight, and key out white to ARGB
    auto loadStudioKnob = [](const void* data, int size, bool deepenBlack) -> juce::Image {
        auto raw = juce::ImageCache::getFromMemory(data, size);
        if (!raw.isValid()) return {};
        const int rw = raw.getWidth(), rh = raw.getHeight();
        int minX = rw, maxX = 0, minY = rh, maxY = 0;
        for (int y = 0; y < rh; ++y) {
            for (int x = 0; x < rw; ++x) {
                const auto px = raw.getPixelAt(x, y);
                if (px.getRed() < 238 || px.getGreen() < 238 || px.getBlue() < 238) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX <= minX || maxY <= minY) return raw;
        const int cw = maxX - minX + 1;
        const int ch = maxY - minY + 1;
        const int side = juce::jmax(cw, ch);
        const int ox = minX - (side - cw) / 2;
        const int oy = minY - (side - ch) / 2;

        constexpr int kOut = 180;
        juce::Image cropped(juce::Image::ARGB, side, side, true);
        {
            juce::Graphics cg(cropped);
            cg.drawImage(raw, -ox, -oy, rw, rh, 0, 0, rw, rh);
        }
        auto scaled = cropped.rescaled(kOut, kOut, juce::Graphics::highResamplingQuality);
        const float c = kOut * 0.5f;
        const float maxR = kOut * 0.495f;
        juce::Image::BitmapData bd(scaled, juce::Image::BitmapData::readWrite);
        for (int y = 0; y < kOut; ++y) {
            for (int x = 0; x < kOut; ++x) {
                const float dx = static_cast<float>(x) - c;
                const float dy = static_cast<float>(y) - c;
                const float dist = std::sqrt(dx * dx + dy * dy);
                auto col = bd.getPixelColour(x, y);
                const bool isBg = (col.getRed() > 236 && col.getGreen() > 236 && col.getBlue() > 236 && dist > maxR * 0.85f);
                if (dist > maxR || isBg) {
                    bd.setPixelColour(x, y, col.withAlpha(0.0f));
                } else {
                    if (deepenBlack) {
                        // Deepen matte bakelite body while preserving bright ivory pointer
                        const float luma = col.getBrightness();
                        if (luma < 0.68f) {
                            const float d = std::pow(luma, 1.95f) * 0.82f;
                            col = juce::Colour::fromFloatRGBA(d, d * 0.99f, d * 0.96f, 1.0f);
                        } else {
                            col = juce::Colour(0xfff5f1e6);
                        }
                    }
                    if (dist > maxR - 2.5f) {
                        const float aa = juce::jlimit(0.0f, 1.0f, (maxR - dist) / 2.5f);
                        col = col.withMultipliedAlpha(aa);
                    }
                    bd.setPixelColour(x, y, col);
                }
            }
        }
        return scaled;
    };

    knobBlackImg  = loadStudioKnob(BinaryData::knob_black_jpg,  BinaryData::knob_black_jpgSize, true);
    knobSilverImg = loadStudioKnob(BinaryData::knob_silver_jpg, BinaryData::knob_silver_jpgSize, false);

    // Fallback walnut & aluminum textures for bottom Teclado/Salida console strip
    juce::Random rng(42);
    walnutImg = juce::Image(juce::Image::RGB, 600, 140, true);
    {
        juce::Image::BitmapData bd(walnutImg, juce::Image::BitmapData::writeOnly);
        for (int y = 0; y < 140; ++y) {
            const float ny = static_cast<float>(y) / 140.0f;
            for (int x = 0; x < 600; ++x) {
                const float nx = static_cast<float>(x) / 600.0f;
                const float gr = juce::jlimit(0.0f, 1.0f, (std::sin(ny * 40.0f + std::sin(nx * 6.5f) * 1.8f) + 1.0f) * 0.5f);
                bd.setPixelColour(x, y, juce::Colour(
                    static_cast<uint8_t>(42.0f + gr * 34.0f),
                    static_cast<uint8_t>(28.0f + gr * 22.0f),
                    static_cast<uint8_t>(18.0f + gr * 14.0f)));
            }
        }
    }
    aluminumImg = juce::Image(juce::Image::RGB, 256, 128, true);
    {
        juce::Image::BitmapData bd(aluminumImg, juce::Image::BitmapData::writeOnly);
        for (int y = 0; y < 128; ++y) {
            const float rowStreak = (rng.nextFloat() - 0.5f) * 6.0f;
            for (int x = 0; x < 256; ++x) {
                const float v = 228.0f + rowStreak + (rng.nextFloat() - 0.5f) * 3.0f;
                bd.setPixelColour(x, y, juce::Colour(
                    static_cast<uint8_t>(juce::jlimit(190.0f, 244.0f, v)),
                    static_cast<uint8_t>(juce::jlimit(187.0f, 241.0f, v - 3.0f)),
                    static_cast<uint8_t>(juce::jlimit(178.0f, 232.0f, v - 11.0f))));
            }
        }
    }
}

void OmnifonV2LookAndFeel::drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                                            float sliderPos, float rotaryStartAngle,
                                            float rotaryEndAngle, juce::Slider& slider) {
    const float radius = static_cast<float>(juce::jmin(width, height)) * 0.45f;
    const float cx = static_cast<float>(x) + static_cast<float>(width) * 0.5f;
    const float cy = static_cast<float>(y) + static_cast<float>(height) * 0.5f;
    const float angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    const bool isSilver = slider.getProperties().getWithDefault("silverKnob", false);

    // Subtle calibration tick marks around large knobs
    if (radius >= 18.0f) {
        g.setColour(juce::Colour(0xff262420).withAlpha(0.8f));
        for (int t = 0; t <= 10; ++t) {
            const float a = rotaryStartAngle + (static_cast<float>(t) / 10.0f) * (rotaryEndAngle - rotaryStartAngle) - juce::MathConstants<float>::halfPi;
            const float r1 = radius + 2.0f;
            const float r2 = radius + (t % 5 == 0 ? 5.5f : 3.5f);
            g.drawLine(cx + std::cos(a) * r1, cy + std::sin(a) * r1,
                       cx + std::cos(a) * r2, cy + std::sin(a) * r2, 1.0f);
        }
    }

    // Fixed studio soft drop shadow underneath (does not rotate!)
    g.setColour(juce::Colours::black.withAlpha(0.42f));
    g.fillEllipse(cx - radius + 2.0f, cy - radius + 3.5f, radius * 2.0f, radius * 2.0f);

    // Draw rotated photorealistic studio-lit knob sprite
    const auto& img = isSilver ? knobSilverImg : knobBlackImg;
    if (img.isValid()) {
        const float scale = (radius * 2.04f) / static_cast<float>(img.getWidth());
        auto tf = juce::AffineTransform::translation(-img.getWidth() * 0.5f, -img.getHeight() * 0.5f)
                      .scaled(scale)
                      .rotated(angle)
                      .translated(cx, cy);
        g.drawImageTransformed(img, tf, false);
    }
}

void OmnifonV2LookAndFeel::drawLinearSlider(juce::Graphics& g, int x, int y, int width, int height,
                                            float sliderPos, float, float,
                                            juce::Slider::SliderStyle style, juce::Slider&) {
    const bool isVert = (style == juce::Slider::LinearVertical);
    if (isVert) {
        const float cx = static_cast<float>(x) + static_cast<float>(width) * 0.5f;
        g.setColour(juce::Colour(0xff2a2825));
        g.fillRoundedRectangle(cx - 2.0f, static_cast<float>(y) + 4.0f, 4.0f, static_cast<float>(height) - 8.0f, 2.0f);

        g.setColour(juce::Colours::black.withAlpha(0.3f));
        g.fillRoundedRectangle(cx - 7.0f, sliderPos - 4.0f, 15.0f, 10.0f, 2.0f);
        g.setColour(juce::Colour(0xff232220));
        g.fillRoundedRectangle(cx - 8.0f, sliderPos - 5.0f, 16.0f, 10.0f, 2.0f);
        g.setColour(juce::Colour(0xfff2efe6));
        g.drawHorizontalLine(static_cast<int>(sliderPos), cx - 6.0f, cx + 6.0f);
    } else {
        const float cy = static_cast<float>(y) + static_cast<float>(height) * 0.5f;
        g.setColour(juce::Colour(0xff2a2825));
        g.fillRoundedRectangle(static_cast<float>(x) + 4.0f, cy - 1.8f, static_cast<float>(width) - 8.0f, 3.6f, 1.8f);

        g.setColour(juce::Colours::black.withAlpha(0.3f));
        g.fillRoundedRectangle(sliderPos - 4.0f, cy - 5.0f, 10.0f, 12.0f, 2.0f);
        g.setColour(juce::Colour(0xff232220));
        g.fillRoundedRectangle(sliderPos - 5.0f, cy - 6.0f, 10.0f, 12.0f, 2.0f);
        g.setColour(juce::Colour(0xfff2efe6));
        g.drawVerticalLine(static_cast<int>(sliderPos), cy - 4.5f, cy + 4.5f);
    }
}

void OmnifonV2LookAndFeel::drawButtonBackground(juce::Graphics& g, juce::Button& button,
                                                const juce::Colour&,
                                                bool highlighted, bool down) {
    auto b = button.getLocalBounds().toFloat().reduced(0.5f);
    if (button.getProperties().getWithDefault("metalPush", false)) {
        // Authentic vintage round metallic pushbutton
        const float r = juce::jmin(b.getWidth(), b.getHeight()) * 0.44f;
        const float cx = b.getCentreX(), cy = b.getCentreY();
        g.setColour(juce::Colours::black.withAlpha(0.35f));
        g.fillEllipse(cx - r + 1.0f, cy - r + 1.5f, r * 2.0f, r * 2.0f);
        g.setColour(juce::Colour(0xff524f49));
        g.fillEllipse(cx - r, cy - r, r * 2.0f, r * 2.0f);
        const float ir = r * (down ? 0.72f : 0.78f);
        juce::ColourGradient cap(down ? juce::Colour(0xff9a968c) : juce::Colour(0xfff0ece2), cx - ir, cy - ir,
                                 juce::Colour(0xff7e7a70), cx + ir, cy + ir, false);
        g.setGradientFill(cap);
        g.fillEllipse(cx - ir, cy - ir, ir * 2.0f, ir * 2.0f);
        return;
    }

    const bool toggled = button.getToggleState();
    juce::Colour bg = toggled ? juce::Colour(0xffece8da) : juce::Colour(0xff2c2a26);
    if (down) bg = bg.darker(0.15f);
    else if (highlighted) bg = bg.brighter(0.08f);

    g.setColour(bg);
    g.fillRoundedRectangle(b, 4.0f);
    g.setColour(toggled ? juce::Colour(0xffc8c2b2) : juce::Colour(0xff5e5a50));
    g.drawRoundedRectangle(b, 4.0f, 1.0f);
}

void OmnifonV2LookAndFeel::drawToggleButton(juce::Graphics& g, juce::ToggleButton& button,
                                            bool, bool) {
    auto b = button.getLocalBounds().toFloat();
    if (button.getProperties().getWithDefault("metalToggle", false)) {
        // Authentic vintage metal hardware toggle switch
        const float cx = b.getCentreX();
        const float cy = b.getCentreY();
        const bool on = button.getToggleState();
        // Hex/round chrome mounting nut
        g.setColour(juce::Colours::black.withAlpha(0.3f));
        g.fillEllipse(cx - 5.5f, cy - 4.5f, 11.5f, 11.5f);
        g.setColour(juce::Colour(0xffbab6aa));
        g.fillEllipse(cx - 5.5f, cy - 5.5f, 11.0f, 11.0f);
        g.setColour(juce::Colour(0xff262420));
        g.fillEllipse(cx - 3.0f, cy - 3.0f, 6.0f, 6.0f);
        // Metallic toggle bat (up when ON, down when OFF)
        const float batY = on ? (cy - 7.0f) : (cy + 2.0f);
        g.setColour(juce::Colour(0xff3a3834));
        g.fillRoundedRectangle(cx - 2.2f, batY, 4.4f, 6.5f, 2.0f);
        g.setColour(juce::Colour(0xffeae6dc));
        g.fillRoundedRectangle(cx - 1.5f, batY + 0.5f, 3.0f, 5.5f, 1.5f);
        return;
    }

    // Top-bar LED toggle (DAW SYNC / TRANSPORT)
    const bool on = button.getToggleState();
    const auto ledCol = button.findColour(juce::ToggleButton::tickColourId);
    g.setColour(juce::Colour(0xff2a2825));
    g.fillRoundedRectangle(b.reduced(0.5f), 4.0f);
    g.setColour(juce::Colour(0xff555148));
    g.drawRoundedRectangle(b.reduced(0.5f), 4.0f, 1.0f);

    const float lx = b.getX() + 10.0f;
    const float ly = b.getCentreY();
    if (on) {
        g.setColour(ledCol.withAlpha(0.35f));
        g.fillEllipse(lx - 6.0f, ly - 6.0f, 12.0f, 12.0f);
    }
    g.setColour(on ? ledCol : juce::Colour(0xff423e38));
    g.fillEllipse(lx - 3.5f, ly - 3.5f, 7.0f, 7.0f);

    g.setColour(button.findColour(juce::ToggleButton::textColourId));
    g.setFont(juce::FontOptions(10.5f, juce::Font::bold));
    g.drawText(button.getButtonText(), static_cast<int>(lx + 8), 0, static_cast<int>(b.getWidth() - 22),
               static_cast<int>(b.getHeight()), juce::Justification::centredLeft);
}

// ── CRT Green Phosphor Oscilloscope
void OscilloscopeView::paint(juce::Graphics& g) {
    auto b = getLocalBounds().toFloat();
    g.setColour(juce::Colour(0xff0b1710));
    g.fillRoundedRectangle(b, 5.0f);
    g.setColour(juce::Colour(0xff2c3d32));
    g.drawRoundedRectangle(b, 5.0f, 1.5f);

    g.setColour(juce::Colour(0xff1d3a28));
    g.drawHorizontalLine(static_cast<int>(b.getCentreY()), b.getX() + 2.0f, b.getRight() - 2.0f);
    g.drawVerticalLine(static_cast<int>(b.getCentreX()), b.getY() + 2.0f, b.getBottom() - 2.0f);

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
    g.setColour(juce::Colour(0xff3dff8a).withAlpha(0.28f));
    g.strokePath(wave, juce::PathStrokeType(4.0f));
    g.setColour(juce::Colour(0xff7dffb0));
    g.strokePath(wave, juce::PathStrokeType(1.6f));
}

// ── CableLayerComponent (Semi-translucent braided grey cables with drop shadows)
CableLayerComponent::CableLayerComponent(OmnifonAudioProcessor& p, const std::vector<JackSocket>& j)
    : processor(p), jacks(j) {
    setInterceptsMouseClicks(true, false);
}

const JackSocket* CableLayerComponent::findJackAt(juce::Point<float> pt, float maxDist) const {
    for (const auto& j : jacks)
        if (j.center.getDistanceFrom(pt) <= maxDist) return &j;
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
    const float alpha = isFaded ? 0.22f : 0.86f;
    auto drawWire = [&](juce::Point<float> a, juce::Point<float> b, juce::Colour col) {
        const float dist = a.getDistanceFrom(b);
        const float sag = juce::jmin(125.0f, 26.0f + dist * 0.24f);
        juce::Path path;
        path.startNewSubPath(a);
        path.cubicTo(a.x, a.y + sag, b.x, b.y + sag, b.x, b.y);

        // Soft studio drop shadow
        g.setColour(juce::Colours::black.withAlpha(alpha * 0.34f));
        g.strokePath(path, juce::PathStrokeType(5.0f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded),
                     juce::AffineTransform::translation(1.0f, 4.0f));
        // Outer cable sheath
        g.setColour(col.darker(0.25f).withAlpha(alpha));
        g.strokePath(path, juce::PathStrokeType(4.2f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
        // Inner braided sheen
        g.setColour(col.brighter(0.15f).withAlpha(alpha));
        g.strokePath(path, juce::PathStrokeType(2.2f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

        // Plug tips
        g.setColour(juce::Colour(0xff2e2c29).withAlpha(alpha));
        g.fillEllipse(a.x - 4.5f, a.y - 4.5f, 9.0f, 9.0f);
        g.fillEllipse(b.x - 4.5f, b.y - 4.5f, 9.0f, 9.0f);
    };

    const auto cables = processor.getCables();
    for (size_t i = 0; i < cables.size(); ++i) {
        const auto a = findOutCenter(cables[i].from);
        const auto b = findInCenter(cables[i].to);
        if (a.isOrigin() || b.isOrigin()) continue;
        const juce::Colour col = (i % 3 == 0) ? juce::Colour(0xff9c9a92)
                               : (i % 3 == 1) ? juce::Colour(0xff848179)
                                              : juce::Colour(0xff6b6962);
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

    // ── Top Bar: Patch Browser + DAW Sync + Utility Buttons
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

    patchPrevBtn.onClick = [this] {
        const int n = patchBox.getNumItems();
        if (n <= 0) return;
        const int cur = patchBox.getSelectedItemIndex();
        patchBox.setSelectedItemIndex(cur <= 0 ? n - 1 : cur - 1, juce::sendNotification);
    };
    patchNextBtn.onClick = [this] {
        const int n = patchBox.getNumItems();
        if (n <= 0) return;
        const int cur = patchBox.getSelectedItemIndex();
        patchBox.setSelectedItemIndex((cur + 1) % n, juce::sendNotification);
    };
    addAndMakeVisible(patchPrevBtn);
    addAndMakeVisible(patchNextBtn);

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
    dimCablesBtn.setColour(juce::TextButton::textColourOnId, juce::Colour(0xff1a1917));
    dimCablesBtn.setColour(juce::TextButton::textColourOffId, juce::Colour(0xffece8da));
    dimCablesBtn.onClick = [this] {
        if (cableLayer) cableLayer->setFaded(dimCablesBtn.getToggleState());
    };
    addAndMakeVisible(dimCablesBtn);

    clearCablesBtn.setColour(juce::TextButton::textColourOffId, juce::Colour(0xffece8da));
    clearCablesBtn.onClick = [this] {
        audioProcessor.clearAllCables();
        if (cableLayer) cableLayer->repaint();
    };
    addAndMakeVisible(clearCablesBtn);

    toggleKbBtn.setClickingTogglesState(true);
    toggleKbBtn.setToggleState(false, juce::dontSendNotification);
    toggleKbBtn.setColour(juce::TextButton::textColourOnId, juce::Colour(0xff1a1917));
    toggleKbBtn.setColour(juce::TextButton::textColourOffId, juce::Colour(0xffece8da));
    toggleKbBtn.onClick = [this] {
        showKeyboard = toggleKbBtn.getToggleState();
        updateWindowHeight();
    };
    addAndMakeVisible(toggleKbBtn);

    infoMenuBtn.setColour(juce::TextButton::textColourOffId, juce::Colour(0xfff3ead3));
    infoMenuBtn.onClick = [this] { showInfoMenu(); };
    addAndMakeVisible(infoMenuBtn);

    bpmLabel.setJustificationType(juce::Justification::centredRight);
    bpmLabel.setColour(juce::Label::textColourId, juce::Colour(0xfff3ead3));
    bpmLabel.setFont(juce::FontOptions(12.0f, juce::Font::bold));
    bpmLabel.setText("120.0 BPM", juce::dontSendNotification);
    addAndMakeVisible(bpmLabel);

    // ── APVTS Knobs (Silver metallic for Oscilador frecuencia & Filtro-V Centro)
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

    // ── Integrador & Pulsador vintage metal switches / pushbuttons
    intAutoBtn.setButtonText("");
    intAutoBtn.getProperties().set("metalToggle", true);
    intAutoBtn.onClick = [this] { audioProcessor.setIntegradorAutoCycle(intAutoBtn.getToggleState()); };
    addAndMakeVisible(intAutoBtn);

    intTrigBtn.setButtonText("");
    intTrigBtn.getProperties().set("metalPush", true);
    intTrigBtn.onStateChange = [this] { audioProcessor.setIntegradorManual(intTrigBtn.isDown()); };
    addAndMakeVisible(intTrigBtn);

    pulStartBtn.setButtonText("");
    pulStopBtn.setButtonText("");
    pulStartBtn.getProperties().set("metalPush", true);
    pulStopBtn.getProperties().set("metalPush", true);
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
        seqSwitches[s].getProperties().set("metalToggle", true);
        seqSwitches[s].onClick = [this, s] {
            audioProcessor.setSeqSwitch(static_cast<int>(s), seqSwitches[s].getToggleState());
        };
        addAndMakeVisible(seqSwitches[s]);
    }

    addAndMakeVisible(scope);
    keyboard.setAvailableRange(36, 96);
    keyboard.setScrollButtonsVisible(false);
    keyboard.setColour(juce::MidiKeyboardComponent::whiteNoteColourId, juce::Colour(0xfff3eee1));
    keyboard.setColour(juce::MidiKeyboardComponent::blackNoteColourId, juce::Colour(0xff1d1c1a));
    keyboard.setColour(juce::MidiKeyboardComponent::keySeparatorLineColourId, juce::Colour(0xffbfb8a6));
    keyboard.setColour(juce::MidiKeyboardComponent::mouseOverKeyOverlayColourId, juce::Colour(0x33c96a2b));
    keyboard.setColour(juce::MidiKeyboardComponent::keyDownOverlayColourId, juce::Colour(0xffc96a2b));
    keyboard.setColour(juce::MidiKeyboardComponent::textLabelColourId, juce::Colour(0xff6b655a));
    keyboard.setColour(juce::MidiKeyboardComponent::shadowColourId, juce::Colours::black.withAlpha(0.35f));
    addAndMakeVisible(keyboard);

    // ── Jack Socket Coordinates (14 modules)
    auto addIn  = [&](omnifon::InPin pin, float x, float y, const char* lbl) { jacks.push_back({ true,  static_cast<int>(pin), { x, y }, lbl }); };
    auto addOut = [&](omnifon::OutPin pin, float x, float y, const char* lbl) { jacks.push_back({ false, static_cast<int>(pin), { x, y }, lbl }); };

    // Row 1
    addIn (omnifon::IN_ENV_ENTRADA,   40, 102, "E1");
    addIn (omnifon::IN_ENV_CONTROL,   40, 146, "E2");
    addOut(omnifon::OUT_ENV_S1,      224, 102, "S1");
    addOut(omnifon::OUT_ENV_S2,      224, 146, "S2");

    addIn (omnifon::IN_ALE_PULSO,    282, 120, "Ent");
    addOut(omnifon::OUT_ALE_ESC,     454, 102, "Esc");
    addOut(omnifon::OUT_ALE_SUAVE,   454, 146, "Sua");

    addIn (omnifon::IN_ANI_A,        512,  94, "A");
    addIn (omnifon::IN_ANI_B,        512, 122, "B");
    addIn (omnifon::IN_ANI_MOD,      512, 150, "M");
    addOut(omnifon::OUT_ANI_SAL1,    688, 102, "S1");
    addOut(omnifon::OUT_ANI_SAL2,    688, 146, "S2");

    addOut(omnifon::OUT_RUI_BLANCO,  918, 102, "blanco");
    addOut(omnifon::OUT_RUI_ROSA,    918, 146, "rosa");

    addIn (omnifon::IN_REV_E1,       974, 102, "E1");
    addIn (omnifon::IN_REV_E2,       974, 146, "E2");
    addOut(omnifon::OUT_REV_SAL1,   1158, 102, "S1");
    addOut(omnifon::OUT_REV_SAL2,   1158, 146, "S2");

    // Row 2
    addIn (omnifon::IN_INT_PULSO,     40, 260, "pulso");
    addOut(omnifon::OUT_INT_SAL1,    224, 218, "env");
    addOut(omnifon::OUT_INT_SAL2,    224, 246, "env");
    addOut(omnifon::OUT_INT_PULSO,   224, 300, "pulso");

    addIn (omnifon::IN_OSC1_FREC,    274, 220, "frec");
    addIn (omnifon::IN_OSC1_MOD,     274, 334, "FM");
    addOut(omnifon::OUT_OSC1_SEN,    456, 212, "~");
    addOut(omnifon::OUT_OSC1_TRI,    456, 238, "^");
    addOut(omnifon::OUT_OSC1_RAMPA,  456, 264, "/|");
    addOut(omnifon::OUT_OSC1_CUAD,   456, 290, "[]");

    addIn (omnifon::IN_OSC2_FREC,    508, 220, "frec");
    addIn (omnifon::IN_OSC2_MOD,     508, 334, "FM");
    addOut(omnifon::OUT_OSC2_SEN,    690, 212, "~");
    addOut(omnifon::OUT_OSC2_TRI,    690, 238, "^");
    addOut(omnifon::OUT_OSC2_RAMPA,  690, 264, "/|");
    addOut(omnifon::OUT_OSC2_CUAD,   690, 290, "[]");

    addIn (omnifon::IN_FIV_ENTRADA,  742, 210, "Ent");
    addIn (omnifon::IN_FIV_ANCHO_CV, 742, 242, "Anc");
    addIn (omnifon::IN_FIV_CONTROL,  742, 288, "Cen");
    addIn (omnifon::IN_FIV_MOD,      742, 334, "Mod");
    addOut(omnifon::OUT_FIV_BAJOS,   924, 220, "baj.");
    addOut(omnifon::OUT_FIV_ALTOS,   924, 272, "alt.");
    addOut(omnifon::OUT_FIV_BANDA,   924, 324, "banda");

    addIn (omnifon::IN_FIO_ENTRADA,  974, 212, "Ent");
    addOut(omnifon::OUT_FIO_SUMA,   1162, 342, "Suma");

    // Row 3
    addIn (omnifon::IN_PUL_INICIO,    40, 412, "inicio");
    addIn (omnifon::IN_PUL_FIN,       40, 442, "fin");
    addIn (omnifon::IN_PUL_ANCHO_CV,  40, 484, "Pulsos");
    addIn (omnifon::IN_PUL_RELOJ_CV,  40, 534, "reloj");
    addOut(omnifon::OUT_PUL_1,       224, 424, "P1");
    addOut(omnifon::OUT_PUL_2,       224, 464, "P2");
    addOut(omnifon::OUT_PUL_INV,     224, 504, "Inv");

    // Sequencer
    addIn (omnifon::IN_SEQ_PULSO,    278, 412, "pulsos");
    addOut(omnifon::OUT_SEQ_PULSO,   306, 412, "Salida");
    addIn (omnifon::IN_SEQ_REINICIO, 334, 412, "rein.");
    addOut(omnifon::OUT_SEQ_A,       278, 454, "F1");
    addOut(omnifon::OUT_SEQ_B,       278, 490, "F2");
    addOut(omnifon::OUT_SEQ_C,       278, 526, "F3");
    addOut(omnifon::OUT_SEQ_VOLT,    278, 556, "volt");
    for (int i = 0; i < 10; ++i) {
        addOut(static_cast<omnifon::OutPin>(omnifon::OUT_SEQ_ST0 + i),
               384.0f + static_cast<float>(i) * 82.0f, 412.0f, "");
    }

    // Bottom strip: Teclado & Salida
    addOut(omnifon::OUT_TEC_VOLT,    208, 622, "V");
    addOut(omnifon::OUT_TEC_PULSO,   208, 654, "P");
    addIn (omnifon::IN_SAL_IZQ,      852, 622, "L");
    addIn (omnifon::IN_SAL_DER,      852, 654, "R");

    cableLayer = std::make_unique<CableLayerComponent>(audioProcessor, jacks);
    addAndMakeVisible(*cableLayer);

    syncNonApvtsControlsFromProcessor();
    updateWindowHeight();
    startTimerHz(30);
}

OmnifonAudioProcessorEditor::~OmnifonAudioProcessorEditor() {
    setLookAndFeel(nullptr);
}

void OmnifonAudioProcessorEditor::showInfoMenu() {
    juce::PopupMenu m;
    m.addSectionHeader("Omnifon · Raul Pavon Sarrelangue (c. 1960-1981)");
    m.addItem(1, "Anexo: Investigacion Documental Completa (Tablas y Graficos)");
    m.addItem(2, "Manual de Usuario Ilustrado (GitHub)");
    m.addItem(3, "Omnifon Virtual (Version Web)");
    m.addSeparator();
    m.addItem(4, "Extasis Records (Bandcamp)");
    m.addItem(5, "@laurorobles (Instagram)");
    m.addSeparator();
    m.addItem(6, "Acerca del Omnifon VST v2.0");

    m.showMenuAsync(juce::PopupMenu::Options().withTargetComponent(&infoMenuBtn), [](int res) {
        if (res == 1) juce::URL("https://laurorobles.github.io/Omnifon/investigacion.html").launchInDefaultBrowser();
        else if (res == 2) juce::URL("https://github.com/laurorobles/Omnifon/blob/main/docs/MANUAL.md").launchInDefaultBrowser();
        else if (res == 3) juce::URL("https://laurorobles.github.io/Omnifon/").launchInDefaultBrowser();
        else if (res == 4) juce::URL("https://extasisrecords.bandcamp.com").launchInDefaultBrowser();
        else if (res == 5) juce::URL("https://www.instagram.com/laurorobles/").launchInDefaultBrowser();
        else if (res == 6) {
            juce::AlertWindow::showMessageBoxAsync(
                juce::MessageBoxIconType::InfoIcon,
                "Omnifon VST v2.0 · Extasis Records",
                "Recreacion modular del primer sintetizador analogico mexicano disenado por Raul Pavon Sarrelangue (c. 1960-64 / CENIDIM 1981).\n\n"
                "Desarrollado por @laurorobles · Extasis Records.\n"
                "Motor DSP nativo C++20 con 14 modulos, DAW Sync y soporte MIDI completo (Notas, Pitch Bend y CC).");
        }
    });
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
    const juce::String& paramId, const juce::String& title, bool isSilver, bool showText) {
    auto k = std::make_unique<KnobControl>();
    k->slider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    k->slider.setTextBoxStyle(showText ? juce::Slider::TextBoxBelow : juce::Slider::NoTextBox, false, 52, 13);
    k->slider.setColour(juce::Slider::textBoxTextColourId, juce::Colour(0xff22201d));
    k->slider.setColour(juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
    k->slider.getProperties().set("silverKnob", isSilver);
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
        repaint(350, 384, 830, 22);
    }
    scope.repaint();
}

void OmnifonAudioProcessorEditor::paint(juce::Graphics& g) {
    // ── Photorealistic studio-lit walnut cabinet + 12 blank brushed aluminum plates!
    const auto& fp = lnf.getFaceplateImage();
    // Seamless dark weathered walnut base below cabinet (matches cabinet wood, no stripes)
    juce::ColourGradient baseWood(juce::Colour(0xff2c1d13), 0.0f, 580.0f,
                                  juce::Colour(0xff1d130c), 0.0f, static_cast<float>(getHeight()), false);
    g.setGradientFill(baseWood);
    g.fillRect(0, 580, getWidth(), getHeight() - 580);
    if (fp.isValid()) {
        g.drawImage(fp, 0, 48, getWidth(), 536, 0, 0, fp.getWidth(), fp.getHeight());
    }

    // ── Sleek dark anodized top bar
    g.setColour(juce::Colour(0xff1c1b19));
    g.fillRect(0, 0, getWidth(), 48);
    g.setColour(juce::Colour(0xff3e3b35));
    g.drawHorizontalLine(47, 0.0f, static_cast<float>(getWidth()));

    g.setColour(juce::Colour(0xfff2ede0));
    g.setFont(juce::FontOptions(17.5f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("O M N I F Ó N"), 14, 5, 190, 22, juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xffb5ae9c));
    g.setFont(juce::FontOptions(9.5f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("Raúl Pavón Sarrelangue  ·  c. 1960–1981"), 14, 27, 210, 14, juce::Justification::centredLeft);

    // Elegant creator & label credit centered on the bottom walnut console strip
    g.setColour(juce::Colour(0xffcbbda4).withAlpha(0.82f));
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("E X T A S I S   R E C O R D S"), 260, 616, 550, 18, juce::Justification::centred);
    g.setColour(juce::Colour(0xffa99b82).withAlpha(0.75f));
    g.setFont(juce::FontOptions(10.0f));
    g.drawText(juce::String::fromUTF8("Recreación virtual por @laurorobles  ·  México"), 260, 636, 550, 16, juce::Justification::centred);

    // Helper: Phillips-head corner screw
    auto drawScrew = [&](float sx, float sy) {
        g.setColour(juce::Colour(0xff6b6860));
        g.fillEllipse(sx - 3.5f, sy - 3.5f, 7.0f, 7.0f);
        g.setColour(juce::Colour(0xffc9c5ba));
        g.fillEllipse(sx - 2.8f, sy - 2.8f, 5.6f, 5.6f);
        g.setColour(juce::Colour(0xff44423d));
        g.drawLine(sx - 1.8f, sy, sx + 1.8f, sy, 0.9f);
        g.drawLine(sx, sy - 1.8f, sx, sy + 1.8f, 0.9f);
    };

    // Helper: draw crisp silkscreen title + stamp on top of the photorealistic faceplate
    auto drawPlateLabels = [&](int x, int y, int w, int h, const juce::String& title, bool drawSolidBg = false) {
        if (drawSolidBg) {
            juce::Rectangle<float> r(static_cast<float>(x), static_cast<float>(y),
                                     static_cast<float>(w), static_cast<float>(h));
            g.setColour(juce::Colours::black.withAlpha(0.45f));
            g.fillRoundedRectangle(r.translated(1.5f, 2.5f), 3.0f);
            g.setColour(juce::Colour(0xffe7e4db));
            g.fillRoundedRectangle(r, 3.0f);
            g.setOpacity(0.35f);
            const auto& alum = lnf.getAluminumImage();
            g.drawImage(alum, x + 1, y + 1, w - 2, h - 2, 0, 0, alum.getWidth(), alum.getHeight());
            g.setOpacity(1.0f);
            g.setColour(juce::Colour(0xff8e8a7f));
            g.drawRoundedRectangle(r, 3.0f, 1.2f);
            drawScrew(r.getX() + 7.0f, r.getY() + 7.0f);
            drawScrew(r.getRight() - 7.0f, r.getY() + 7.0f);
            drawScrew(r.getX() + 7.0f, r.getBottom() - 7.0f);
            drawScrew(r.getRight() - 7.0f, r.getBottom() - 7.0f);
        }

        // Crisp, clear bold module header title
        g.setColour(juce::Colour(0xff11100e));
        g.setFont(juce::FontOptions(12.0f, juce::Font::bold));
        g.drawText(title, x + 16, y + 4, w - 32, 16, juce::Justification::centred);

        // Micro OMNIFÓN stamp at bottom-left
        g.setColour(juce::Colour(0xff2c2a26));
        g.setFont(juce::FontOptions(8.0f, juce::Font::bold));
        g.drawText("OMNIFON", x + 16, y + h - 14, 60, 10, juce::Justification::centredLeft);
    };

    // Row 1: 5 modules (aligned to faceplate_clean.jpg plate seams!)
    drawPlateLabels(28,  72, 214, 102, "ENVOLVEDOR");
    drawPlateLabels(254, 72, 222, 102, "ALEATOR");
    drawPlateLabels(488, 72, 222, 102, "MOD. ANULAR");
    drawPlateLabels(722, 72, 222, 102, "RUIDOR");
    drawPlateLabels(956, 72, 216, 102, "REVERBERAL");

    // Row 2: 5 modules
    drawPlateLabels(28,  190, 214, 178, "INTEGRADOR ENVOLV.");
    drawPlateLabels(254, 190, 222, 178, "OSCILADOR");
    drawPlateLabels(488, 190, 222, 178, "OSCILADOR");
    drawPlateLabels(722, 190, 222, 178, "FILTRO-V");
    drawPlateLabels(956, 190, 216, 178, "FILTRO-O");

    // Row 3: Pulsador + Secuenciador
    drawPlateLabels(28,  386, 214, 184, "PULSADOR");
    drawPlateLabels(254, 386, 918, 184, "S E C U E N C I A D O R");

    // Bottom strip: Teclado & Salida (solid plates on walnut base)
    drawPlateLabels(16,  584, 228, 100, "TECLADO", true);
    drawPlateLabels(830, 584, 354, 100, "SALIDA & OSCILOSCOPIO", true);

    // Silkscreened section labels ("Entradas" / "Salidas") & band frequencies
    g.setColour(juce::Colour(0xff2c2a26));
    g.setFont(juce::FontOptions(8.5f, juce::Font::bold));
    auto drawES = [&](int x, int y, int w) {
        g.drawText("Entradas", x + 12, y + 18, 48, 11, juce::Justification::centredLeft);
        g.drawText("Salidas",  x + w - 60, y + 18, 48, 11, juce::Justification::centredRight);
    };
    drawES(28,  72, 214);
    drawES(254, 72, 222);
    drawES(488, 72, 222);
    g.drawText("Salidas", 722 + 222 - 60, 72 + 18, 48, 11, juce::Justification::centredRight);
    g.drawText("blanco", 862, 96, 42, 11, juce::Justification::centredRight);
    g.drawText("rosa",   862, 140, 42, 11, juce::Justification::centredRight);
    drawES(956, 72, 216);
    drawES(28,  190, 214);
    drawES(254, 190, 222);
    drawES(488, 190, 222);
    drawES(722, 190, 222);
    drawES(956, 190, 216);
    drawES(28,  386, 214);

    // Filtro-O frequency labels (25 Hz - 13k Hz)
    static constexpr const char* kBandLabels[10] = { "25", "50", "100", "200", "400", "800", "1.6k", "3.2k", "6.5k", "13k" };
    g.setFont(juce::FontOptions(8.0f, juce::Font::bold));
    for (int b = 0; b < 10; ++b) {
        g.drawText(kBandLabels[b], 1148, 198 + b * 14, 28, 13, juce::Justification::centredLeft);
    }
    g.drawText("Suma", 992, 353, 40, 11, juce::Justification::centredLeft);

    // Vintage dark walnut keybed bezel + crimson felt strip when keyboard is shown
    if (showKeyboard) {
        g.setColour(juce::Colour(0xff19110b));
        g.fillRoundedRectangle(14.0f, 694.0f, static_cast<float>(getWidth() - 28), 128.0f, 4.0f);
        // Classic red felt strip above the keys
        g.setColour(juce::Colour(0xff6e1d19));
        g.fillRect(22, 699, getWidth() - 44, 5);
    }

    // Sequencer 10 red LEDs + step numbers
    for (int i = 0; i < 10; ++i) {
        const float lx = 379.0f + static_cast<float>(i) * 82.0f;
        const bool on = (i == activeStep);
        if (on) {
            g.setColour(juce::Colour(0xffff3b30).withAlpha(0.35f));
            g.fillEllipse(lx - 3.0f, 389.0f, 16.0f, 16.0f);
        }
        g.setColour(on ? juce::Colour(0xffff3b30) : juce::Colour(0xff4a201d));
        g.fillEllipse(lx, 392.0f, 10.0f, 10.0f);

        g.setColour(juce::Colour(0xff1a1917));
        g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
        g.drawText(juce::String(i + 1), static_cast<int>(lx - 6), 422, 22, 12, juce::Justification::centred);
    }

    // Draw all 3.5mm Jack Sockets with clear Input vs Output visual distinction & labels
    g.setFont(juce::FontOptions(8.0f, juce::Font::bold));
    for (const auto& j : jacks) {
        g.setColour(juce::Colours::black.withAlpha(0.28f));
        g.fillEllipse(j.center.x - 6.5f, j.center.y - 5.5f, 13.5f, 13.5f);

        if (j.isInput) {
            // Input jack: warm dark bronze/gunmetal ring
            g.setColour(juce::Colour(0xff524d45));
            g.fillEllipse(j.center.x - 6.8f, j.center.y - 6.8f, 13.6f, 13.6f);
            g.setColour(juce::Colour(0xffb8b2a4));
            g.drawEllipse(j.center.x - 6.8f, j.center.y - 6.8f, 13.6f, 13.6f, 1.1f);
        } else {
            // Output jack: bright machined chrome nut with dark outer collar
            g.setColour(juce::Colour(0xff1f1e1c));
            g.fillEllipse(j.center.x - 7.5f, j.center.y - 7.5f, 15.0f, 15.0f);
            g.setColour(juce::Colour(0xffe6e2d8));
            g.fillEllipse(j.center.x - 6.2f, j.center.y - 6.2f, 12.4f, 12.4f);
        }
        g.setColour(juce::Colour(0xff0b0a09));
        g.fillEllipse(j.center.x - 3.3f, j.center.y - 3.3f, 6.6f, 6.6f);

        // Draw crisp jack label right beside each socket
        if (j.label.isNotEmpty() && j.label != "blanco" && j.label != "rosa" && j.label != "Suma") {
            g.setColour(juce::Colour(0xff23211d));
            if (j.isInput) {
                g.drawText(j.label, static_cast<int>(j.center.x + 8), static_cast<int>(j.center.y - 6), 28, 12,
                           juce::Justification::centredLeft);
            } else {
                g.drawText(j.label, static_cast<int>(j.center.x - 36), static_cast<int>(j.center.y - 6), 28, 12,
                           juce::Justification::centredRight);
            }
        }
    }
}

void OmnifonAudioProcessorEditor::resized() {
    // Top bar
    patchPrevBtn.setBounds   (216, 10,  26, 28);
    patchBox.setBounds       (244, 10, 152, 28);
    patchNextBtn.setBounds   (398, 10,  26, 28);
    dawSyncBtn.setBounds     (436, 10,  92, 28);
    dawDivBox.setBounds      (530, 10,  66, 28);
    dawTransportBtn.setBounds(600, 10,  98, 28);
    dimCablesBtn.setBounds   (706, 10,  70, 28);
    clearCablesBtn.setBounds (780, 10,  76, 28);
    toggleKbBtn.setBounds    (860, 10,  68, 28);
    infoMenuBtn.setBounds    (932, 10,  86, 28);
    bpmLabel.setBounds       (1024, 10, 162, 28);

    auto placeKnob = [](KnobControl* k, int x, int y, int w, int h) {
        k->label.setBounds(x, y, w, 12);
        k->slider.setBounds(x, y + 12, w, h - 12);
    };

    // Row 1
    placeKnob(kEnvNivel,     72,  82, 58, 68);
    placeKnob(kEnvMod,      138,  82, 58, 68);
    placeKnob(kAnilloNivel, 566,  86, 64, 72);
    placeKnob(kRevInt,     1010,  82, 58, 68);
    placeKnob(kRevTiempo,  1076,  82, 58, 68);

    // Row 2
    placeKnob(kIntAtaque,    88, 206, 54, 54);
    intAutoBtn.setBounds    (158, 222, 22, 22);
    intTrigBtn.setBounds    (158, 252, 22, 22);
    placeKnob(kIntDur,       88, 260, 54, 54);
    placeKnob(kIntDec,       88, 312, 54, 54);

    placeKnob(kOsc1Freq,    298, 200, 74, 84);
    placeKnob(kOsc1Ancho,   380, 214, 56, 60);
    placeKnob(kOsc1Mod,     326, 288, 60, 66);

    placeKnob(kOsc2Freq,    532, 200, 74, 84);
    placeKnob(kOsc2Mod,     560, 288, 60, 66);

    placeKnob(kFivAncho,    770, 198, 54, 58);
    placeKnob(kFivCentro,   766, 262, 70, 80);
    placeKnob(kFivMod,      844, 272, 56, 60);

    // Filtro-O
    fioCorteSlider.setBounds(962, 230, 22, 120);
    for (size_t b = 0; b < 10; ++b)
        fioBandSliders[b].setBounds(992, 198 + static_cast<int>(b) * 14, 156, 14);
    fioSumaSlider.setBounds(992, 340, 148, 16);

    // Row 3: Pulsador
    pulStartBtn.setBounds(74,  404, 22, 22);
    pulStopBtn.setBounds (74,  434, 22, 22);
    placeKnob(kPulAncho,  120, 412, 62, 66);
    placeKnob(kPulReloj,   88, 482, 74, 80);

    // Row 3: Sequencer 3x10 knobs + 10 switches
    for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 10; ++col) {
            const int idx = row * 10 + col;
            seqKnobs[static_cast<size_t>(idx)].setBounds(
                366 + col * 82, 436 + row * 37, 36, 36);
        }
    }
    for (int col = 0; col < 10; ++col) {
        seqSwitches[static_cast<size_t>(col)].setBounds(373 + col * 82, 548, 24, 22);
    }

    // Bottom strip: Teclado & Salida
    placeKnob(kTecPort, 74, 604, 68, 72);
    scope.setBounds(878, 606, 206, 68);
    placeKnob(kSalVol, 1096, 604, 68, 72);

    // Collapsible 5-octave keyboard (exact 36 white keys edge-to-edge, zero scroll arrows)
    const int kbW = getWidth() - 44;
    keyboard.setBounds(22, 704, kbW, 112);
    keyboard.setKeyWidth(static_cast<float>(kbW) / 36.0f);

    // Cable overlay covers entire modular cabinet (same coordinates as jacks)
    if (cableLayer) cableLayer->setBounds(0, 0, getWidth(), kHeightNoKb);
}
