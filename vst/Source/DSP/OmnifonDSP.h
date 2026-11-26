#pragma once

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <vector>

namespace omnifon {

constexpr double kPi = 3.14159265358979323846;
constexpr double kTau = kPi * 2.0;
constexpr std::array<float, 10> kBands = { 25.f, 50.f, 100.f, 200.f, 400.f, 800.f, 1600.f, 3200.f, 6500.f, 13000.f };

inline float clampf(float x, float a, float b) noexcept {
    return x < a ? a : (x > b ? b : x);
}

inline float polyBlep(float t, float dt) noexcept {
    if (t < dt) {
        t /= dt;
        return t + t - t * t - 1.0f;
    }
    if (t > 1.0f - dt) {
        t = (t - 1.0f) / dt;
        return t * t + t + t + 1.0f;
    }
    return 0.0f;
}

inline float softClip(float x) noexcept {
    if (x > 3.0f) return 1.0f;
    if (x < -3.0f) return -1.0f;
    const float x2 = x * x;
    return (x * (27.0f + x2)) / (27.0f + 9.0f * x2);
}

// Xoshiro128** PRNG (matches processors.ts)
struct Rng {
    uint32_t s[4] { 1, 2, 3, 4 };
    explicit Rng(uint32_t seed = 1) {
        uint32_t x = seed ? seed : 1u;
        for (int i = 0; i < 4; ++i) {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            s[i] = x;
        }
    }
    static uint32_t rotl(uint32_t v, int k) noexcept {
        return (v << k) | (v >> (32 - k));
    }
    float next() noexcept {
        const uint32_t r = rotl(s[1] * 5u, 7) * 9u;
        const uint32_t t = s[1] << 9;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = rotl(s[3], 11);
        return static_cast<float>(r) * (1.0f / 4294967296.0f);
    }
    float bipolar() noexcept { return next() * 2.0f - 1.0f; }
};

struct Svf {
    float ic1 = 0.0f, ic2 = 0.0f;
    float low = 0.0f, band = 0.0f, high = 0.0f;
    void reset() noexcept { ic1 = ic2 = low = band = high = 0.0f; }
    void process(float v0, float g, float k) noexcept {
        const float a1 = 1.0f / (1.0f + g * (g + k));
        const float a2 = g * a1;
        const float a3 = g * a2;
        const float v3 = v0 - ic2;
        const float v1 = a1 * ic1 + a2 * v3;
        const float v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2.0f * v1 - ic1;
        ic2 = 2.0f * v2 - ic2;
        low = v2;
        band = v1;
        high = v0 - k * v1 - v2;
    }
};

struct Trigger {
    float prev = 0.0f;
    void reset() noexcept { prev = 0.0f; }
    bool rise(float v) noexcept {
        const bool r = (v > 0.5f && prev <= 0.5f);
        prev = v;
        return r;
    }
};

// DAW Sync state passed from PluginProcessor::processBlock
struct DawSyncInfo {
    bool enabled = false;        // DAW Sync ON/OFF
    bool followTransport = true; // Follow DAW Play/Stop & reset sequencer
    int divisionIndex = 5;       // 0:1/1, 1:1/2, 2:1/4, 3:1/8, 4:1/8T, 5:1/16, 6:1/16T, 7:1/32
    double bpm = 120.0;
    bool isPlaying = false;
    bool hasPpq = false;
    double ppqPosition = 0.0;

    // Pulses per quarter note for each division
    double pulsesPerQuarter() const noexcept {
        static constexpr double kDivs[8] = {
            0.25,       // 1/1 (whole)
            0.5,        // 1/2
            1.0,        // 1/4
            2.0,        // 1/8
            3.0,        // 1/8T
            4.0,        // 1/16
            6.0,        // 1/16T
            8.0         // 1/32
        };
        return kDivs[std::clamp(divisionIndex, 0, 7)];
    }
};

// ── 1. Envolvedor (VCA)
struct EnvolvedorDSP {
    float nivel = 0.0f;
    float mod = 0.9f;
    void process(float x, float c, float& o1, float& o2) noexcept {
        const float g = clampf(nivel + mod * c, 0.0f, 2.0f);
        const float y = x * g;
        o1 = o2 = y;
    }
};

// ── 2. Aleator (S&H / Smooth Random)
struct AleatorDSP {
    Rng rng { 0xa1ea7u };
    Trigger trig;
    double ph = 0.0;
    float value = 0.0f;
    float smooth = 0.0f;
    float sr = 44100.0f;
    float cSmooth = 0.0003f;

    void prepare(double sampleRate) noexcept {
        sr = static_cast<float>(sampleRate);
        cSmooth = 1.0f - std::exp(static_cast<float>(-kTau * 2.2 / sampleRate));
        trig.reset();
        ph = 0.0;
    }

    void process(bool hasTrigIn, float trigIn, float& oEsc, float& oSuave) noexcept {
        bool fire = false;
        if (hasTrigIn) {
            fire = trig.rise(trigIn);
        } else {
            ph += 2.5 / static_cast<double>(sr);
            if (ph >= 1.0) {
                ph -= 1.0;
                fire = true;
            }
        }
        if (fire) value = rng.bipolar();
        smooth += (value - smooth) * cSmooth;
        oEsc = value * 0.8f;
        oSuave = smooth * 0.8f;
    }
};

// ── 3. Mod. Anular (Ring Modulator)
struct AnilloDSP {
    float nivel = 0.8f;
    double ph = 0.0;
    double sr = 44100.0;

    void prepare(double sampleRate) noexcept { sr = sampleRate; ph = 0.0; }

    void process(float a, bool hasB, float b, bool hasM, float m, float& o1, float& o2) noexcept {
        float carrier = 0.0f;
        if (hasB) {
            carrier = b;
        } else {
            const float f = clampf(220.0f * std::pow(2.0f, hasM ? m : 0.0f), 1.0f, static_cast<float>(0.45 * sr));
            ph += static_cast<double>(f) / sr;
            if (ph >= 1.0) ph -= std::floor(ph);
            carrier = static_cast<float>(std::sin(kTau * ph));
        }
        const float modScale = (hasB && hasM) ? clampf(1.0f + m * 0.5f, 0.0f, 2.0f) : 1.0f;
        const float y = a * carrier * nivel * modScale;
        o1 = o2 = y;
    }
};

// ── 4. Ruidor (White & Pink Noise)
struct RuidorDSP {
    Rng rng { 0x4f4d4e49u };
    double b[7] { 0, 0, 0, 0, 0, 0, 0 };

    void process(float& oWhite, float& oPink) noexcept {
        const double w = static_cast<double>(rng.bipolar());
        b[0] = 0.99886 * b[0] + w * 0.0555179;
        b[1] = 0.99332 * b[1] + w * 0.0750759;
        b[2] = 0.96900 * b[2] + w * 0.1538520;
        b[3] = 0.86650 * b[3] + w * 0.3104856;
        b[4] = 0.55000 * b[4] + w * 0.5329522;
        b[5] = -0.7616 * b[5] - w * 0.0168980;
        const double pink = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11;
        b[6] = w * 0.115926;
        oWhite = static_cast<float>(w * 0.75);
        oPink = static_cast<float>(pink * 0.75);
    }
};

// ── 5. Reverberal (Schroeder/Freeverb-style Dual Reverb)
struct Comb {
    std::vector<float> buf;
    size_t idx = 0;
    float store = 0.0f;
    void init(size_t len) { buf.assign(std::max<size_t>(1, len), 0.0f); idx = 0; store = 0.0f; }
    float process(float x, float fb, float damp) noexcept {
        const float y = buf[idx];
        store = y * (1.0f - damp) + store * damp;
        buf[idx] = x + store * fb;
        if (++idx >= buf.size()) idx = 0;
        return y;
    }
};

struct Allpass {
    std::vector<float> buf;
    size_t idx = 0;
    void init(size_t len) { buf.assign(std::max<size_t>(1, len), 0.0f); idx = 0; }
    float process(float x) noexcept {
        const float b = buf[idx];
        buf[idx] = x + b * 0.5f;
        if (++idx >= buf.size()) idx = 0;
        return b - x;
    }
};

struct ReverberalDSP {
    float intensidad = 0.42f;
    float tiempo = 0.68f;
    std::array<Comb, 8> combs;
    std::array<Allpass, 4> aps;

    void prepare(double sampleRate) {
        static constexpr int kCombLens[8] = { 1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617 };
        static constexpr int kApLens[4] = { 556, 441, 341, 225 };
        for (size_t i = 0; i < 8; ++i)
            combs[i].init(static_cast<size_t>(std::round(kCombLens[i] * sampleRate / 44100.0)));
        for (size_t i = 0; i < 4; ++i)
            aps[i].init(static_cast<size_t>(std::round(kApLens[i] * sampleRate / 44100.0)));
    }

    void process(float x1, float x2, float& o1, float& o2) noexcept {
        const float v = x1 + x2;
        const float vin = v * 0.015f;
        const float fb = 0.68f + tiempo * 0.29f;
        float wet = 0.0f;
        for (auto& c : combs) wet += c.process(vin, fb, 0.25f);
        for (auto& a : aps) wet = a.process(wet);
        const float y = v * (1.0f - intensidad) + wet * 3.0f * intensidad;
        o1 = o2 = y;
    }
};

// ── 6. Integrador Envolv. (3-Stage Trapezoid Envelope)
struct IntegradorDSP {
    enum class Stage { Idle, Attack, Hold, Decay };
    float ataque = 0.01f;
    float duracion = 0.09f;
    float decaimiento = 0.22f;
    bool autoCycle = false;
    bool manual = false;

    float env = 0.0f;
    Stage stage = Stage::Idle;
    int holdSamples = 0;
    bool gate = false;
    double sr = 44100.0;

    void prepare(double sampleRate) noexcept {
        sr = sampleRate;
        env = 0.0f;
        stage = Stage::Idle;
        gate = false;
    }

    void process(float pIn, float& oE1, float& oE2, float& oPls) noexcept {
        const float cA = 1.0f - std::exp(static_cast<float>(-1.79 / (std::max(0.005f, ataque) * sr)));
        const int holdTarget = std::max(1, static_cast<int>(std::round(std::max(0.005f, duracion) * sr)));
        const float cD = 1.0f - std::exp(static_cast<float>(-6.9 / (std::max(0.005f, decaimiento) * sr)));

        const bool extGate = manual || (pIn > 0.5f);
        if (extGate && !gate) stage = Stage::Attack;
        gate = extGate;

        if (autoCycle && stage == Stage::Idle) stage = Stage::Attack;

        switch (stage) {
            case Stage::Attack:
                env += (1.2f - env) * cA;
                if (env >= 1.0f) {
                    env = 1.0f;
                    holdSamples = holdTarget;
                    stage = Stage::Hold;
                }
                break;
            case Stage::Hold:
                env = 1.0f;
                if (holdSamples > 0) holdSamples--;
                if (holdSamples <= 0 && (autoCycle || !extGate)) stage = Stage::Decay;
                break;
            case Stage::Decay:
                env -= env * cD;
                if (env < 1e-4f) {
                    env = 0.0f;
                    stage = autoCycle ? Stage::Attack : Stage::Idle;
                }
                break;
            case Stage::Idle:
                break;
        }

        oE1 = oE2 = env;
        oPls = (stage == Stage::Attack || stage == Stage::Hold) ? 1.0f : 0.0f;
    }
};

// ── 7 & 8. Oscilador (VCO with PolyBLEP)
struct OsciladorDSP {
    float frecuencia = 261.63f;
    float fino = 0.0f;
    float ancho = 0.5f;
    float modulador = 0.0f;
    bool rec = false;

    double ph = 0.0;
    double sr = 44100.0;

    void prepare(double sampleRate) noexcept { sr = sampleRate; ph = 0.0; }

    void process(float cvF, float cvM, float& oS, float& oT, float& oR, float& oQ) noexcept {
        const float mVal = rec ? std::max(0.0f, cvM) : cvM;
        const float pitch = std::log2(std::max(0.5f, frecuencia)) + (fino / 12.0f) + cvF + mVal * modulador * 3.0f;
        const float nyq = static_cast<float>(0.45 * sr);
        const float f = clampf(std::pow(2.0f, pitch), 0.01f, nyq);
        const float dt = static_cast<float>(f / sr);

        ph += static_cast<double>(dt);
        if (ph >= 1.0) ph -= std::floor(ph);
        const float p = static_cast<float>(ph);
        const float w = clampf(ancho, 0.03f, 0.97f);

        oS = std::sin(static_cast<float>(kTau) * p);
        oT = 1.0f - 4.0f * std::abs(p - 0.5f);
        oR = 2.0f * p - 1.0f - polyBlep(p, dt);
        float p2 = p - w;
        if (p2 < 0.0f) p2 += 1.0f;
        oQ = (p < w ? 1.0f : -1.0f) + polyBlep(p, dt) - polyBlep(p2, dt);
    }
};

// ── 9. Filtro-V (State-Variable Filter)
struct FiltroVDSP {
    float centro = 600.0f;
    float corte = 0.0f;
    float ancho = 0.35f;
    float modulacion = 2.2f;
    Svf svf;
    double sr = 44100.0;

    void prepare(double sampleRate) noexcept { sr = sampleRate; svf.reset(); }

    void process(float x, float wCv, float cv, float cm, float& oL, float& oH, float& oB) noexcept {
        const float fmax = static_cast<float>(0.49 * sr);
        const float lc = std::log2(std::max(5.0f, centro)) + corte + cv + cm * modulacion;
        const float fc = clampf(std::pow(2.0f, lc), 10.0f, fmax);
        const float g = std::tan(static_cast<float>(kPi * fc / sr));
        const float w = clampf(ancho + wCv * 0.4f, 0.0f, 1.0f);
        const float k = 0.04f + w * 1.96f;
        svf.process(softClip(x), g, k);
        oL = svf.low;
        oH = svf.high;
        oB = svf.band;
    }
};

// ── 10. Filtro-O (10-Band Octave Filter Bank)
struct FiltroODSP {
    float corte = 0.85f;
    std::array<float, 10> gains { 0.7f, 0.7f, 0.7f, 0.7f, 0.7f, 0.7f, 0.7f, 0.7f, 0.7f, 0.7f };
    float suma = 0.72f;
    std::array<Svf, 10> svfs;
    std::array<float, 10> gs {};

    void prepare(double sampleRate) noexcept {
        for (size_t b = 0; b < 10; ++b) {
            svfs[b].reset();
            const double f = std::min<double>(kBands[b], 0.45 * sampleRate);
            gs[b] = static_cast<float>(std::tan(kPi * f / sampleRate));
        }
    }

    void process(float x, float& oSum, std::array<float, 10>& oBands) noexcept {
        constexpr float K = 0.7071f;
        float sum = 0.0f;
        for (size_t b = 0; b < 10; ++b) {
            svfs[b].process(x, gs[b], K);
            const float tilt = clampf(1.0f - (1.0f - corte) * (static_cast<float>(b) / 9.0f) * 1.3f, 0.0f, 1.0f);
            const float y = svfs[b].band * K * gains[b] * tilt;
            oBands[b] = y;
            sum += y;
        }
        oSum = sum * suma;
    }
};

// ── 11. Pulsador (Master Clock with DAW Sync!)
struct PulsadorDSP {
    float reloj = 4.5f;
    float ancho = 0.35f;
    bool running = true;
    double ph = 0.0;
    double sr = 44100.0;
    Trigger tStart, tStop;
    bool wasDawPlaying = false;

    void prepare(double sampleRate) noexcept {
        sr = sampleRate;
        ph = 0.0;
        tStart.reset();
        tStop.reset();
        wasDawPlaying = false;
    }

    // Call once per block before sample loop if DAW Sync is active
    bool syncBlockStart(const DawSyncInfo& sync) noexcept {
        bool requestSeqReset = false;
        if (sync.enabled && sync.followTransport) {
            if (sync.isPlaying && !wasDawPlaying) {
                requestSeqReset = true;
                running = true;
                if (sync.hasPpq) {
                    const double totalPulses = sync.ppqPosition * sync.pulsesPerQuarter();
                    ph = totalPulses - std::floor(totalPulses);
                } else {
                    ph = 0.0;
                }
            } else if (!sync.isPlaying && wasDawPlaying) {
                running = false;
            }
            wasDawPlaying = sync.isPlaying;
        }
        return requestSeqReset;
    }

    void process(float a, float b, float wCv, bool hasWCv, float rCv, bool hasRCv,
                 const DawSyncInfo& sync, float& o1, float& o2, float& o3) noexcept {
        if (tStart.rise(a)) { running = true; ph = 0.0; }
        if (tStop.rise(b)) { running = false; }

        double rate = static_cast<double>(reloj);
        if (sync.enabled) {
            const double bpm = std::clamp(sync.bpm, 20.0, 300.0);
            rate = (bpm / 60.0) * sync.pulsesPerQuarter();
        }
        if (hasRCv) {
            rate = clampf(static_cast<float>(rate * std::pow(2.0, static_cast<double>(rCv))), 0.05f, 100.0f);
        }

        const float w = hasWCv ? clampf(ancho + wCv * 0.4f, 0.05f, 0.95f) : ancho;

        const bool active = (sync.enabled && sync.followTransport) ? sync.isPlaying : running;
        float v = 0.0f;
        if (active) {
            v = (ph < static_cast<double>(w)) ? 1.0f : 0.0f;
            ph += rate / sr;
            if (ph >= 1.0) ph -= std::floor(ph);
        }
        o1 = o2 = v;
        o3 = active ? (1.0f - v) : 0.0f;
    }
};

// ── 12. Secuenciador (3 x 10 Analog Matrix)
struct SecuenciadorDSP {
    std::array<float, 30> s {};
    std::array<bool, 10> sw { true, true, true, true, true, true, true, true, true, true };
    int step = 0;
    bool started = false;
    int resetAtStep = -1; // -1 = none (full 10 steps)
    Trigger tClock, tReset;

    void reset() noexcept {
        step = 0;
        started = false;
        tClock.reset();
        tReset.reset();
    }

    void process(float ck, float rs, float& oPls, float& oA, float& oB, float& oC,
                 float& oVolt, std::array<float, 10>& oSteps) noexcept {
        if (tReset.rise(rs)) {
            step = 0;
            started = false;
        }
        if (tClock.rise(ck)) {
            if (!started) {
                step = 0;
                started = true;
            } else {
                step = (step + 1) % 10;
            }
            if (resetAtStep >= 0 && step == resetAtStep) {
                step = 0;
            }
        }
        const float a = s[static_cast<size_t>(step)];
        oA = std::round(a * 24.0f) / 12.0f;
        oB = s[static_cast<size_t>(10 + step)] * 2.0f;
        oC = s[static_cast<size_t>(20 + step)] * 2.0f;
        oVolt = a * 2.0f;
        oPls = (sw[static_cast<size_t>(step)] && ck > 0.5f) ? 1.0f : 0.0f;
        for (int k = 0; k < 10; ++k) oSteps[static_cast<size_t>(k)] = (k == step) ? 1.0f : 0.0f;
    }
};

// ── 13. Teclado (MIDI -> 1V/oct CV + Gate + Portamento + Pitch Bend)
struct TecladoDSP {
    float portamento = 0.0f;
    float pitchBendSemitones = 0.0f;
    std::vector<int> held;
    int note = 60;
    float noteSm = 60.0f;
    int retrig = 0;
    double sr = 44100.0;

    void prepare(double sampleRate) noexcept {
        sr = sampleRate;
        held.reserve(16);
        held.clear();
        note = 60;
        noteSm = 60.0f;
        pitchBendSemitones = 0.0f;
        retrig = 0;
    }

    void noteOn(int n) {
        const bool wasHeld = !held.empty();
        held.erase(std::remove(held.begin(), held.end(), n), held.end());
        held.push_back(n);
        note = n;
        if (wasHeld) retrig = 64;
    }

    void noteOff(int n) {
        held.erase(std::remove(held.begin(), held.end(), n), held.end());
        if (!held.empty()) note = held.back();
    }

    void setPitchBend(int wheelValue14Bit) noexcept {
        // 0..16383, center 8192 -> ±2 semitones
        pitchBendSemitones = (static_cast<float>(wheelValue14Bit - 8192) / 8192.0f) * 2.0f;
    }

    void allOff() noexcept { held.clear(); }

    void process(float& oVolt, float& oGate) noexcept {
        const float c = portamento > 0.0005f
            ? (1.0f - std::exp(static_cast<float>(-1.0 / (portamento * sr))))
            : 1.0f;
        noteSm += (static_cast<float>(note) - noteSm) * c;
        oVolt = (noteSm + pitchBendSemitones - 60.0f) / 12.0f;
        float g = held.empty() ? 0.0f : 1.0f;
        if (retrig > 0) {
            retrig--;
            g = 0.0f;
        }
        oGate = g;
    }
};

// ── 14. Salida (Stereo Output Stage with Soft Limiter)
struct SalidaDSP {
    float volumen = 0.65f;
    void process(bool hasA, float a, bool hasB, float b, float& outL, float& outR) noexcept {
        const bool both = hasA && hasB;
        const float lv = both ? (a * 0.85f + b * 0.25f) : (hasA ? a : (hasB ? b : 0.0f));
        const float rv = both ? (b * 0.85f + a * 0.25f) : (hasB ? b : (hasA ? a : 0.0f));
        outL = softClip(lv * volumen * 1.4f);
        outR = softClip(rv * volumen * 1.4f);
    }
};

} // namespace omnifon
