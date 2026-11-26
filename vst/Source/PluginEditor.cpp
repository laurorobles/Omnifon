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
                        // Deep pitch-black matte bakelite body like the mockup
                        const float luma = col.getBrightness();
                        const float d = std::pow(luma, 2.6f) * 0.48f;
                        col = juce::Colour::fromFloatRGBA(d, d * 0.99f, d * 0.96f, 1.0f);
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
    const float radius = static_cast<float>(juce::jmin(width, height)) * 0.44f;
    const float cx = static_cast<float>(x) + static_cast<float>(width) * 0.5f;
    const float cy = static_cast<float>(y) + static_cast<float>(height) * 0.5f;
    const float angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    const bool isSilver = slider.getProperties().getWithDefault("silverKnob", false);

    // Calibration tick marks around large knobs (matches mockup)
    if (radius >= 20.0f) {
        g.setColour(juce::Colour(0xff1e1d1a));
        for (int t = 0; t <= 10; ++t) {
            const float a = rotaryStartAngle + (static_cast<float>(t) / 10.0f) * (rotaryEndAngle - rotaryStartAngle) - juce::MathConstants<float>::halfPi;
            const float r1 = radius + 2.0f;
            const float r2 = radius + (t % 5 == 0 ? 5.5f : 3.5f);
            g.drawLine(cx + std::cos(a) * r1, cy + std::sin(a) * r1,
                       cx + std::cos(a) * r2, cy + std::sin(a) * r2, 1.1f);
        }
    }

    // 1. Soft studio drop shadow (fixed top-down light)
    g.setColour(juce::Colours::black.withAlpha(0.42f));
    g.fillEllipse(cx - radius + 1.8f, cy - radius + 3.4f, radius * 2.0f, radius * 2.0f);

    if (isSilver) {
        // 2A. Mockup-exact Brushed Silver Knob: crisp black outer ring + bright metallic cap
        g.setColour(juce::Colour(0xff141312));
        g.fillEllipse(cx - radius, cy - radius, radius * 2.0f, radius * 2.0f);

        const float capR = radius * 0.86f;
        juce::ColourGradient sheen(juce::Colour(0xfffaf8f2), cx - capR * 0.65f, cy - capR * 0.65f,
                                   juce::Colour(0xffb5b1a6), cx + capR * 0.65f, cy + capR * 0.65f, false);
        sheen.addColour(0.45, juce::Colour(0xffe6e3da));
        sheen.addColour(0.75, juce::Colour(0xffcac6bb));
        g.setGradientFill(sheen);
        g.fillEllipse(cx - capR, cy - capR, capR * 2.0f, capR * 2.0f);

        g.setColour(juce::Colours::white.withAlpha(0.65f));
        g.drawEllipse(cx - capR + 0.5f, cy - capR + 0.5f, (capR - 0.5f) * 2.0f, (capR - 0.5f) * 2.0f, 1.0f);

        juce::Path ptr;
        const float ptrLen = capR * 0.68f;
        ptr.addRoundedRectangle(-1.4f, -capR * 0.92f, 2.8f, ptrLen, 1.1f);
        ptr.applyTransform(juce::AffineTransform::rotation(angle).translated(cx, cy));
        g.setColour(juce::Colour(0xff11100f));
        g.fillPath(ptr);
    } else {
        // 2B. Mockup-exact Deep Pitch-Black Fluted Knob: 100% opaque base + 24 fluted ridges + crisp white pointer
        g.setColour(juce::Colour(0xff11100f));
        g.fillEllipse(cx - radius, cy - radius, radius * 2.0f, radius * 2.0f);

        const int ridges = 24;
        for (int i = 0; i < ridges; ++i) {
            const float a = angle + static_cast<float>(i) * (juce::MathConstants<float>::twoPi / static_cast<float>(ridges));
            const float r1 = radius * 0.80f;
            const float r2 = radius * 0.98f;
            g.setColour((i & 1) ? juce::Colour(0xff2e2d2a) : juce::Colour(0xff0a0a09));
            g.drawLine(cx + std::cos(a) * r1, cy + std::sin(a) * r1,
                       cx + std::cos(a) * r2, cy + std::sin(a) * r2, 2.0f);
        }

        const float capR = radius * 0.78f;
        juce::ColourGradient cap(juce::Colour(0xff32312e), cx - capR * 0.5f, cy - capR * 0.6f,
                                 juce::Colour(0xff121110), cx + capR * 0.6f, cy + capR * 0.7f, false);
        g.setGradientFill(cap);
        g.fillEllipse(cx - capR, cy - capR, capR * 2.0f, capR * 2.0f);

        // Subtle specular rim on top-left of black cap (just like mockup!)
        g.setColour(juce::Colours::white.withAlpha(0.16f));
        g.drawEllipse(cx - capR + 0.5f, cy - capR + 0.5f, (capR - 0.5f) * 2.0f, (capR - 0.5f) * 2.0f, 0.9f);

        juce::Path ptr;
        const float ptrLen = capR * 0.74f;
        const float ptrThick = radius > 15.0f ? 2.4f : 1.9f;
        ptr.addRoundedRectangle(-ptrThick * 0.5f, -capR * 0.92f, ptrThick, ptrLen, 1.0f);
        ptr.applyTransform(juce::AffineTransform::rotation(angle).translated(cx, cy));
        g.setColour(juce::Colour(0xfff7f4ea));
        g.fillPath(ptr);
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

    // ── APVTS Knobs (clean vintage plates: hover/drag popup tooltip instead of digital text boxes!)
    kEnvNivel    = addKnob("env_nivel",       "",           false, false);
    kEnvMod      = addKnob("env_mod",         "",           false, false);
    kAnilloNivel = addKnob("anillo_nivel",    "",           false, false);
    kRevInt      = addKnob("rev_int",         "Intensid.",  false, false);
    kRevTiempo   = addKnob("rev_tiempo",      "tiempo",     false, false);

    kIntAtaque   = addKnob("int_ataque",      "ataque",     false, false);
    kIntDur      = addKnob("int_duracion",    "duracion",   false, false);
    kIntDec      = addKnob("int_decaimiento", "decaimiento",false, false);

    kOsc1Freq    = addKnob("osc1_freq",       "frecuencia", true,  false);
    kOsc1Mod     = addKnob("osc1_mod",        "mod. frec.", true,  false);
    kOsc1Ancho   = addKnob("osc1_ancho",      "ancho",      false, false);

    kOsc2Freq    = addKnob("osc2_freq",       "frecuencia", true,  false);
    kOsc2Mod     = addKnob("osc2_mod",        "mod. frec.", true,  false);

    kFivCentro   = addKnob("fiv_centro",      "Centro",     true,  false);
    kFivAncho    = addKnob("fiv_ancho",       "ancho",      false, false);
    kFivMod      = addKnob("fiv_mod",         "modulacion", false, false);

    kPulReloj    = addKnob("pul_reloj",       "reloj",      true,  false);
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

    // ── Jack Socket Coordinates (strictly aligned to measured faceplate_clean.jpg bounds!)
    auto addIn  = [&](omnifon::InPin pin, float x, float y, const char* lbl) { jacks.push_back({ true,  static_cast<int>(pin), { x, y }, lbl }); };
    auto addOut = [&](omnifon::OutPin pin, float x, float y, const char* lbl) { jacks.push_back({ false, static_cast<int>(pin), { x, y }, lbl }); };

    // Row 1 (Y = 80 .. 198)
    addIn (omnifon::IN_ENV_ENTRADA,   56, 124, "");
    addIn (omnifon::IN_ENV_CONTROL,   56, 166, "");
    addOut(omnifon::OUT_ENV_S1,      234, 124, "");
    addOut(omnifon::OUT_ENV_S2,      234, 166, "");

    addIn (omnifon::IN_ALE_PULSO,    296, 138, "");
    addOut(omnifon::OUT_ALE_ESC,     458, 124, "");
    addOut(omnifon::OUT_ALE_SUAVE,   458, 162, "");

    addIn (omnifon::IN_ANI_A,        516, 116, "");
    addIn (omnifon::IN_ANI_B,        516, 144, "");
    addIn (omnifon::IN_ANI_MOD,      516, 172, "");
    addOut(omnifon::OUT_ANI_SAL1,    686, 124, "");
    addOut(omnifon::OUT_ANI_SAL2,    686, 162, "");

    addOut(omnifon::OUT_RUI_BLANCO,  908, 124, "blanco");
    addOut(omnifon::OUT_RUI_ROSA,    908, 162, "rosa");

    addIn (omnifon::IN_REV_E1,       968, 122, "");
    addIn (omnifon::IN_REV_E2,       968, 164, "");
    addOut(omnifon::OUT_REV_SAL1,   1142, 122, "");
    addOut(omnifon::OUT_REV_SAL2,   1142, 164, "");

    // Row 2 (Y = 200 .. 425)
    addIn (omnifon::IN_INT_PULSO,     56, 298, "pulso");
    addOut(omnifon::OUT_INT_SAL1,    234, 248, "env");
    addOut(omnifon::OUT_INT_SAL2,    234, 280, "");
    addOut(omnifon::OUT_INT_PULSO,   234, 344, "pulso");

    addIn (omnifon::IN_OSC1_FREC,    290, 242, "");
    addIn (omnifon::IN_OSC1_MOD,     290, 386, "");
    addOut(omnifon::OUT_OSC1_SEN,    458, 242, "~");
    addOut(omnifon::OUT_OSC1_TRI,    458, 268, "^");
    addOut(omnifon::OUT_OSC1_RAMPA,  458, 294, "/|");
    addOut(omnifon::OUT_OSC1_CUAD,   458, 320, "[]");

    addIn (omnifon::IN_OSC2_FREC,    516, 242, "");
    addIn (omnifon::IN_OSC2_MOD,     516, 386, "");
    addOut(omnifon::OUT_OSC2_SEN,    686, 242, "~");
    addOut(omnifon::OUT_OSC2_TRI,    686, 268, "^");
    addOut(omnifon::OUT_OSC2_RAMPA,  686, 294, "/|");
    addOut(omnifon::OUT_OSC2_CUAD,   686, 320, "[]");

    addIn (omnifon::IN_FIV_ENTRADA,  742, 238, "");
    addIn (omnifon::IN_FIV_ANCHO_CV, 742, 272, "");
    addIn (omnifon::IN_FIV_CONTROL,  742, 336, "");
    addIn (omnifon::IN_FIV_MOD,      742, 392, "");
    addOut(omnifon::OUT_FIV_BAJOS,   912, 250, "baj.");
    addOut(omnifon::OUT_FIV_ALTOS,   912, 316, "alt.");
    addOut(omnifon::OUT_FIV_BANDA,   912, 382, "banda");

    addIn (omnifon::IN_FIO_ENTRADA,  966, 238, "");
    addOut(omnifon::OUT_FIO_SUMA,   1146, 404, "Suma");

    // Row 3 (Y = 428 .. 589)
    addIn (omnifon::IN_PUL_INICIO,    56, 464, "inicio");
    addIn (omnifon::IN_PUL_FIN,       56, 492, "fin");
    addIn (omnifon::IN_PUL_ANCHO_CV,  56, 526, "");
    addIn (omnifon::IN_PUL_RELOJ_CV,  56, 564, "");
    addOut(omnifon::OUT_PUL_1,       234, 474, "");
    addOut(omnifon::OUT_PUL_2,       234, 512, "");
    addOut(omnifon::OUT_PUL_INV,     234, 550, "");

    // Sequencer (X = 264 .. 1170, Y = 428 .. 589)
    addIn (omnifon::IN_SEQ_PULSO,    286, 462, "pulso");
    addOut(omnifon::OUT_SEQ_PULSO,   316, 462, "");
    addIn (omnifon::IN_SEQ_REINICIO, 344, 462, "");
    addOut(omnifon::OUT_SEQ_A,       286, 498, "F1");
    addOut(omnifon::OUT_SEQ_B,       286, 528, "F2");
    addOut(omnifon::OUT_SEQ_C,       286, 558, "F3");
    addOut(omnifon::OUT_SEQ_VOLT,    316, 574, "volt");
    for (int i = 0; i < 10; ++i) {
        addOut(static_cast<omnifon::OutPin>(omnifon::OUT_SEQ_ST0 + i),
               388.0f + static_cast<float>(i) * 80.0f, 462.0f, "");
    }

    // Bottom strip: Teclado & Salida (Y = 618 .. 714)
    addOut(omnifon::OUT_TEC_VOLT,    208, 650, "V");
    addOut(omnifon::OUT_TEC_PULSO,   208, 682, "P");
    addIn (omnifon::IN_SAL_IZQ,      852, 650, "L");
    addIn (omnifon::IN_SAL_DER,      852, 682, "R");

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
    k->slider.setPopupDisplayEnabled(true, true, this);
    k->slider.getProperties().set("silverKnob", isSilver);
    addAndMakeVisible(k->slider);

    k->label.setText(title, juce::dontSendNotification);
    k->label.setJustificationType(juce::Justification::centred);
    k->label.setColour(juce::Label::textColourId, juce::Colour(0xff11100e));
    k->label.setFont(juce::FontOptions(10.8f, juce::Font::bold));
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
        repaint(350, 436, 820, 24);
    }
    scope.repaint();
}

void OmnifonAudioProcessorEditor::paint(juce::Graphics& g) {
    // ── Photorealistic studio-lit walnut cabinet + 12 blank brushed aluminum plates!
    const auto& fp = lnf.getFaceplateImage();
    // Seamless dark weathered walnut base below cabinet (matches cabinet wood, no stripes)
    juce::ColourGradient baseWood(juce::Colour(0xff2c1d13), 0.0f, 608.0f,
                                  juce::Colour(0xff1d130c), 0.0f, static_cast<float>(getHeight()), false);
    g.setGradientFill(baseWood);
    g.fillRect(0, 608, getWidth(), getHeight() - 608);
    if (fp.isValid()) {
        g.drawImage(fp, 0, 52, getWidth(), 560, 0, 0, fp.getWidth(), fp.getHeight());
    }

    // ── Sleek dark anodized top bar (mockup style)
    juce::ColourGradient topGrad(juce::Colour(0xff23211e), 0.0f, 0.0f,
                                 juce::Colour(0xff171614), 0.0f, 52.0f, false);
    g.setGradientFill(topGrad);
    g.fillRect(0, 0, getWidth(), 52);
    g.setColour(juce::Colour(0xff46423b));
    g.drawHorizontalLine(51, 0.0f, static_cast<float>(getWidth()));

    // Rounded pill housing around Patch Browser (< | 01 · Fig. IV.38 | >)
    g.setColour(juce::Colour(0xff11100f));
    g.fillRoundedRectangle(212.0f, 8.0f, 218.0f, 36.0f, 8.0f);
    g.setColour(juce::Colour(0xff4a463f));
    g.drawRoundedRectangle(212.0f, 8.0f, 218.0f, 36.0f, 8.0f, 1.0f);

    g.setColour(juce::Colour(0xfff5f1e4));
    g.setFont(juce::FontOptions(21.0f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("O M N I F Ó N"), 14, 4, 200, 26, juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xffbfb8a6));
    g.setFont(juce::FontOptions(9.8f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("Raúl Pavón Sarrelangue · c. 1960–1981"), 14, 30, 200, 14, juce::Justification::centredLeft);

    // Elegant creator & label credit centered on the bottom walnut console strip
    g.setColour(juce::Colour(0xffcbbda4).withAlpha(0.85f));
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawText(juce::String::fromUTF8("E X T A S I S   R E C O R D S"), 260, 646, 550, 18, juce::Justification::centred);
    g.setColour(juce::Colour(0xffa99b82).withAlpha(0.78f));
    g.setFont(juce::FontOptions(10.0f));
    g.drawText(juce::String::fromUTF8("Recreación virtual por @laurorobles  ·  México"), 260, 666, 550, 16, juce::Justification::centred);

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

    // Helper: draw crisp silkscreen title + stamp strictly inside measured plate bounds
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

        // Crisp, clear bold module header title strictly inside plate top
        g.setColour(juce::Colour(0xff0d0c0b));
        g.setFont(juce::FontOptions(12.2f, juce::Font::bold));
        g.drawText(title, x + 18, y + 3, w - 36, 15, juce::Justification::centred);

        // Micro OMNIFÓN stamp strictly inside plate bottom-left (next to screw)
        g.setColour(juce::Colour(0xff23211d));
        g.setFont(juce::FontOptions(8.2f, juce::Font::bold));
        g.drawText(juce::String::fromUTF8("OMNIFÓN"), x + 18, y + h - 14, 64, 11, juce::Justification::centredLeft);
    };

    // Exact measured plate rectangles of faceplate_clean.jpg (drawn at 0, 52, 1200, 560):
    // Row 1: Y = 80..198 (H = 118)
    drawPlateLabels(31,  80, 229, 118, "ENVOLVEDOR");
    drawPlateLabels(264, 80, 223, 118, "ALEATOR");
    drawPlateLabels(490, 80, 222, 118, "MOD. ANULAR");
    drawPlateLabels(715, 80, 223, 118, "RUIDOR");
    drawPlateLabels(941, 80, 229, 118, "REVERBERAL");

    // Row 2: Y = 200..425 (H = 225)
    drawPlateLabels(31,  200, 229, 225, "INTEGRADOR ENVOLV.");
    drawPlateLabels(264, 200, 223, 225, "OSCILADOR");
    drawPlateLabels(490, 200, 222, 225, "OSCILADOR");
    drawPlateLabels(715, 200, 223, 225, "FILTRO-V");
    drawPlateLabels(941, 200, 229, 225, "FILTRO-O");

    // Row 3: Y = 428..589 (H = 161)
    drawPlateLabels(31,  428, 229, 161, "PULSADOR");
    drawPlateLabels(264, 428, 906, 161, "S E C U E N C I A D O R");

    // Bottom strip: Teclado & Salida (solid plates on walnut base)
    drawPlateLabels(16,  618, 228, 98, "TECLADO", true);
    drawPlateLabels(830, 618, 354, 98, "SALIDA & OSCILOSCOPIO", true);

    // Silkscreened section labels ("Entradas" / "Salidas") & scale annotations
    g.setColour(juce::Colour(0xff1e1d1a));
    g.setFont(juce::FontOptions(9.2f, juce::Font::bold));
    auto drawES = [&](int x, int y, int w) {
        g.drawText("Entradas", x + 12, y + 20, 54, 12, juce::Justification::centredLeft);
        g.drawText("Salidas",  x + w - 66, y + 20, 54, 12, juce::Justification::centredRight);
    };
    drawES(31,  80, 229);
    drawES(264, 80, 223);
    drawES(490, 80, 222);
    g.drawText("Salidas", 715 + 223 - 66, 80 + 20, 54, 12, juce::Justification::centredRight);
    g.drawText("blanco", 850, 118, 48, 12, juce::Justification::centredRight);
    g.drawText("rosa",   850, 156, 48, 12, juce::Justification::centredRight);
    drawES(941, 80, 229);

    drawES(31,  200, 229);
    drawES(264, 200, 223);
    drawES(490, 200, 222);
    drawES(715, 200, 223);
    drawES(941, 200, 229);
    drawES(31,  428, 229);

    // Oscilador range marks ("5Hz" / "20kHz.") & Filtro-V ("5Hz" / "15kHz")
    g.setFont(juce::FontOptions(8.5f, juce::Font::bold));
    g.drawText("5Hz",    284, 316, 30, 11, juce::Justification::centredLeft);
    g.drawText("20kHz.", 356, 316, 42, 11, juce::Justification::centredRight);
    g.drawText("5Hz",    510, 316, 30, 11, juce::Justification::centredLeft);
    g.drawText("20kHz.", 582, 316, 42, 11, juce::Justification::centredRight);
    g.drawText("Corte",  950, 256, 36, 11, juce::Justification::centred);

    // Filtro-O frequency labels (strictly inside X = 941..1170!)
    static constexpr const char* kBandLabels[10] = { "25", "50", "100", "200", "400", "800", "1.6k", "3.2k", "6.5k", "13k" };
    g.setFont(juce::FontOptions(8.2f, juce::Font::bold));
    for (int b = 0; b < 10; ++b) {
        g.drawText(kBandLabels[b], 1112, 232 + b * 16, 32, 14, juce::Justification::centredLeft);
    }
    g.drawText("Suma", 994, 386, 40, 11, juce::Justification::centredLeft);

    // Vintage dark walnut keybed bezel + crimson felt strip when keyboard is shown
    if (showKeyboard) {
        g.setColour(juce::Colour(0xff19110b));
        g.fillRoundedRectangle(14.0f, 722.0f, static_cast<float>(getWidth() - 28), 128.0f, 4.0f);
        g.setColour(juce::Colour(0xff6e1d19));
        g.fillRect(22, 727, getWidth() - 44, 5);
    }

    // Sequencer 10 red LEDs + step numbers (strictly inside Row 3 Y = 428..589!)
    for (int i = 0; i < 10; ++i) {
        const float lx = 383.0f + static_cast<float>(i) * 80.0f;
        const bool on = (i == activeStep);
        if (on) {
            g.setColour(juce::Colour(0xffff3b30).withAlpha(0.35f));
            g.fillEllipse(lx - 3.0f, 441.0f, 15.0f, 15.0f);
        }
        g.setColour(on ? juce::Colour(0xffff3b30) : juce::Colour(0xff4a201d));
        g.fillEllipse(lx, 444.0f, 9.0f, 9.0f);

        g.setColour(juce::Colour(0xff141312));
        g.setFont(juce::FontOptions(9.5f, juce::Font::bold));
        g.drawText(juce::String(i + 1), static_cast<int>(lx - 6), 471, 22, 11, juce::Justification::centred);
    }

    // ── Authentic Black Silkscreened Connecting Lines (terminate cleanly at jack/knob edges!)
    g.setColour(juce::Colour(0xff181715));
    auto silkLine = [&](float x1, float y1, float x2, float y2) {
        g.drawLine(x1, y1, x2, y2, 1.5f);
    };
    // Row 1: Envolvedor (staggered like mockup!), Aleator, Mod. Anular, Reverberal (stacked like mockup!)
    silkLine(64, 124, 92, 124);     // Env E1 -> Knob 1 edge
    silkLine(64, 166, 144, 166);    // Env E2 -> Knob 2 edge
    silkLine(234, 132, 234, 158);   // Env S1-S2 parallel bus
    silkLine(458, 132, 458, 154);   // Aleator parallel bus
    silkLine(524, 144, 578, 144);   // Mod Anular B -> Nivel edge
    silkLine(686, 132, 686, 154);   // Mod Anular S1-S2 bus
    silkLine(976, 122, 1036, 122);  // Reverberal E1 -> Intensid. edge
    silkLine(976, 164, 1036, 164);  // Reverberal E2 -> tiempo edge
    silkLine(1142, 130, 1142, 156); // Reverberal S1-S2 bus

    // Row 2: Integrador, Osc 1 & 2, Filtro-V
    silkLine(64, 298, 152, 298);    // Integrador pulso -> int switch
    silkLine(234, 256, 234, 272);   // Integrador env1-env2 bus
    silkLine(298, 242, 316, 260);   // Osc1 frec -> silver knob edge
    silkLine(298, 386, 352, 386);   // Osc1 FM -> mod knob edge
    silkLine(524, 242, 542, 260);   // Osc2 frec -> silver knob edge
    silkLine(524, 386, 578, 386);   // Osc2 FM -> mod knob edge
    silkLine(750, 272, 796, 272);   // Filtro-V Anc -> ancho knob edge
    silkLine(750, 336, 792, 336);   // Filtro-V Cen -> Centro knob edge
    silkLine(750, 392, 850, 392);   // Filtro-V Mod -> mod knob edge

    // Row 3: Pulsador
    silkLine(64, 464, 92, 464);     // inicio -> push 1
    silkLine(64, 492, 92, 492);     // fin -> push 2
    silkLine(64, 526, 130, 502);    // Pulsos CV -> knob edge
    silkLine(64, 564, 118, 564);    // reloj CV -> knob edge
    silkLine(234, 482, 234, 542);   // Pulsador P1-P2-Inv vertical bus

    // Draw all 3.5mm Jack Sockets with clear Input vs Output visual distinction & labels
    for (const auto& j : jacks) {
        g.setColour(juce::Colours::black.withAlpha(0.28f));
        g.fillEllipse(j.center.x - 6.5f, j.center.y - 5.5f, 13.5f, 13.5f);

        if (j.isInput) {
            g.setColour(juce::Colour(0xff423e38));
            g.fillEllipse(j.center.x - 6.5f, j.center.y - 6.5f, 13.0f, 13.0f);
            g.setColour(juce::Colour(0xffb8b2a4));
            g.drawEllipse(j.center.x - 6.5f, j.center.y - 6.5f, 13.0f, 13.0f, 1.1f);
        } else {
            g.setColour(juce::Colour(0xff1a1917));
            g.fillEllipse(j.center.x - 7.2f, j.center.y - 7.2f, 14.4f, 14.4f);
            g.setColour(juce::Colour(0xffeae6dc));
            g.fillEllipse(j.center.x - 5.9f, j.center.y - 5.9f, 11.8f, 11.8f);
        }
        g.setColour(juce::Colour(0xff0b0a09));
        g.fillEllipse(j.center.x - 3.2f, j.center.y - 3.2f, 6.4f, 6.4f);

        if (j.label.isNotEmpty() && j.label != "blanco" && j.label != "rosa" && j.label != "Suma") {
            const bool isWave = (j.label == "~" || j.label == "^" || j.label == "/|" || j.label == "[]");
            g.setFont(juce::FontOptions(isWave ? 12.0f : 9.0f, juce::Font::bold));
            g.setColour(juce::Colour(0xff141312));
            if (j.isInput) {
                g.drawText(j.label, static_cast<int>(j.center.x + 8), static_cast<int>(j.center.y - 16), 38, 12,
                           juce::Justification::centredLeft);
            } else {
                g.drawText(j.label, static_cast<int>(j.center.x - 42), static_cast<int>(j.center.y - 6), 34, 12,
                           juce::Justification::centredRight);
            }
        }
    }
}

void OmnifonAudioProcessorEditor::resized() {
    // Top bar (52px tall)
    patchPrevBtn.setBounds   (216, 12,  26, 28);
    patchBox.setBounds       (244, 12, 152, 28);
    patchNextBtn.setBounds   (398, 12,  26, 28);
    dawSyncBtn.setBounds     (438, 12,  92, 28);
    dawDivBox.setBounds      (532, 12,  66, 28);
    dawTransportBtn.setBounds(602, 12,  98, 28);
    dimCablesBtn.setBounds   (708, 12,  70, 28);
    clearCablesBtn.setBounds (782, 12,  76, 28);
    toggleKbBtn.setBounds    (862, 12,  68, 28);
    infoMenuBtn.setBounds    (934, 12,  86, 28);
    bpmLabel.setBounds       (1024, 12, 162, 28);

    auto placeKnob = [](KnobControl* k, int x, int y, int w, int h) {
        if (k->label.getText().isEmpty()) {
            k->label.setBounds(0, 0, 0, 0);
            k->slider.setBounds(x, y, w, h);
        } else {
            k->label.setBounds(x - 6, y, w + 12, 12);
            k->slider.setBounds(x, y + 12, w, h - 12);
        }
    };

    // Row 1 (Y = 80..198): Envolvedor staggered diagonally & Reverberal stacked vertically like mockup!
    placeKnob(kEnvNivel,      90, 100, 48, 48);
    placeKnob(kEnvMod,       142, 142, 48, 48);
    placeKnob(kAnilloNivel,  576, 116, 56, 56);
    placeKnob(kRevInt,      1034,  94, 46, 54);
    placeKnob(kRevTiempo,   1034, 142, 46, 54);

    // Row 2 (Y = 200..425): generous spacing inside 225px-tall plates!
    placeKnob(kIntAtaque,     96, 224, 52, 60);
    intAutoBtn.setBounds     (154, 287, 22, 22);
    intTrigBtn.setBounds     (184, 287, 22, 22);
    placeKnob(kIntDur,        96, 290, 52, 60);
    placeKnob(kIntDec,        96, 354, 52, 60);

    placeKnob(kOsc1Freq,     302, 234, 78, 88);
    placeKnob(kOsc1Ancho,    392, 326, 50, 60);
    placeKnob(kOsc1Mod,      348, 352, 54, 62);

    placeKnob(kOsc2Freq,     528, 234, 78, 88);
    placeKnob(kOsc2Mod,      574, 352, 54, 62);

    placeKnob(kFivAncho,     792, 238, 54, 64);
    placeKnob(kFivCentro,    788, 304, 64, 74);
    placeKnob(kFivMod,       848, 356, 52, 60);

    // Filtro-O (strictly inside X = 941..1170, Y = 200..425)
    fioCorteSlider.setBounds (958, 268, 20, 126);
    for (size_t b = 0; b < 10; ++b)
        fioBandSliders[b].setBounds(990, 232 + static_cast<int>(b) * 16, 118, 14);
    fioSumaSlider.setBounds  (990, 396, 126, 15);

    // Row 3: Pulsador (X = 31..260, Y = 428..589)
    pulStartBtn.setBounds    (96,  453, 22, 22);
    pulStopBtn.setBounds     (96,  481, 22, 22);
    placeKnob(kPulAncho,     128, 466, 54, 62);
    placeKnob(kPulReloj,     116, 524, 58, 64);

    // Row 3: Sequencer 3x10 knobs + 10 switches (strictly inside X = 264..1170, Y = 428..589!)
    for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 10; ++col) {
            const int idx = row * 10 + col;
            seqKnobs[static_cast<size_t>(idx)].setBounds(
                372 + col * 80, 482 + row * 30, 30, 30);
        }
    }
    for (int col = 0; col < 10; ++col) {
        seqSwitches[static_cast<size_t>(col)].setBounds(377 + col * 80, 571, 20, 18);
    }

    // Bottom strip: Teclado & Salida (Y = 618..716)
    placeKnob(kTecPort, 74, 636, 68, 72);
    scope.setBounds(878, 638, 206, 68);
    placeKnob(kSalVol, 1096, 636, 68, 72);

    // Collapsible 5-octave keyboard
    const int kbW = getWidth() - 44;
    keyboard.setBounds(22, 732, kbW, 112);
    keyboard.setKeyWidth(static_cast<float>(kbW) / 36.0f);

    // Cable overlay covers entire modular cabinet (same coordinates as jacks)
    if (cableLayer) cableLayer->setBounds(0, 0, getWidth(), kHeightNoKb);
}
