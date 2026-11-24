#pragma once

#include "OmnifonDSP.h"
#include <array>
#include <string>
#include <vector>

namespace omnifon {

// Flat signal bus: every output jack in the entire 14-module cabinet has a fixed index.
// Zero dynamic allocations in the audio thread!
enum OutPin : int {
    OUT_NONE = 0,
    // Envolvedor
    OUT_ENV_S1, OUT_ENV_S2,
    // Aleator
    OUT_ALE_ESC, OUT_ALE_SUAVE,
    // Anillo
    OUT_ANI_SAL1, OUT_ANI_SAL2,
    // Ruidor
    OUT_RUI_BLANCO, OUT_RUI_ROSA,
    // Reverberal
    OUT_REV_SAL1, OUT_REV_SAL2,
    // Integrador
    OUT_INT_SAL1, OUT_INT_SAL2, OUT_INT_PULSO,
    // Osc1
    OUT_OSC1_SEN, OUT_OSC1_TRI, OUT_OSC1_RAMPA, OUT_OSC1_CUAD,
    // Osc2
    OUT_OSC2_SEN, OUT_OSC2_TRI, OUT_OSC2_RAMPA, OUT_OSC2_CUAD,
    // Filtro-V
    OUT_FIV_BAJOS, OUT_FIV_ALTOS, OUT_FIV_BANDA,
    // Filtro-O
    OUT_FIO_SUMA,
    OUT_FIO_B0, OUT_FIO_B1, OUT_FIO_B2, OUT_FIO_B3, OUT_FIO_B4,
    OUT_FIO_B5, OUT_FIO_B6, OUT_FIO_B7, OUT_FIO_B8, OUT_FIO_B9,
    // Pulsador
    OUT_PUL_1, OUT_PUL_2, OUT_PUL_INV,
    // Secuenciador
    OUT_SEQ_PULSO, OUT_SEQ_A, OUT_SEQ_B, OUT_SEQ_C, OUT_SEQ_VOLT,
    OUT_SEQ_ST0, OUT_SEQ_ST1, OUT_SEQ_ST2, OUT_SEQ_ST3, OUT_SEQ_ST4,
    OUT_SEQ_ST5, OUT_SEQ_ST6, OUT_SEQ_ST7, OUT_SEQ_ST8, OUT_SEQ_ST9,
    // Teclado
    OUT_TEC_VOLT, OUT_TEC_PULSO,
    NUM_OUT_PINS
};

enum InPin : int {
    IN_ENV_ENTRADA = 0, IN_ENV_CONTROL,
    IN_ALE_PULSO,
    IN_ANI_A, IN_ANI_B, IN_ANI_MOD,
    IN_REV_E1, IN_REV_E2,
    IN_INT_PULSO,
    IN_OSC1_FREC, IN_OSC1_MOD,
    IN_OSC2_FREC, IN_OSC2_MOD,
    IN_FIV_ENTRADA, IN_FIV_ANCHO_CV, IN_FIV_CONTROL, IN_FIV_MOD,
    IN_FIO_ENTRADA,
    IN_PUL_INICIO, IN_PUL_FIN, IN_PUL_ANCHO_CV, IN_PUL_RELOJ_CV,
    IN_SEQ_PULSO, IN_SEQ_REINICIO,
    IN_SAL_IZQ, IN_SAL_DER,
    NUM_IN_PINS
};

struct Cable {
    OutPin from;
    InPin to;
};

struct FactoryPatch {
    const char* name;
    std::vector<Cable> cables;
    // Key parameter overrides
    float pulsadorReloj = 4.5f;
    float pulsadorAncho = 0.35f;
    float osc1Freq = 196.0f;
    float osc1Mod = 0.12f;
    float osc1Ancho = 0.5f;
    float osc2Freq = 293.66f;
    float osc2Mod = 0.0f;
    float anilloNivel = 0.75f;
    float intAtaque = 0.008f;
    float intDuracion = 0.06f;
    float intDecaimiento = 0.18f;
    bool intAutoCycle = false;
    float envNivel = 0.0f;
    float envMod = 0.9f;
    float fivCentro = 520.0f;
    float fivCorte = 0.0f;
    float fivAncho = 0.28f;
    float fivMod = 2.2f;
    float fioCorte = 0.85f;
    float fioSuma = 0.68f;
    std::array<float, 10> fioGains { 0.72f, 0.48f, 0.75f, 0.42f, 0.74f, 0.64f, 0.46f, 0.50f, 0.35f, 0.30f };
    float revIntensidad = 0.42f;
    float revTiempo = 0.68f;
    float tecPortamento = 0.0f;
    float salVolumen = 0.65f;
    std::array<float, 10> seqA { 0, 7, 10, 3, 12, 5, 15, 7, 2, 10 }; // semitones
    std::array<float, 10> seqB { 0.15f, 0.75f, 0.35f, 0.85f, 0.25f, 0.65f, 0.90f, 0.40f, 0.55f, 0.30f };
    std::array<float, 10> seqC { 0.75f, 0.25f, 0.55f, 0.30f, 0.85f, 0.20f, 0.50f, 0.35f, 0.60f, 0.45f };
    std::array<bool, 10> seqSw { true, true, true, true, true, true, true, true, true, true };
};

inline std::vector<FactoryPatch> getFactoryPatches() {
    std::vector<FactoryPatch> list;

    // 1. Fig. IV.38 (Raúl Pavón, 1981)
    {
        FactoryPatch p;
        p.name = "1 · Fig. IV.38";
        p.cables = {
            { OUT_PUL_1, IN_INT_PULSO },
            { OUT_PUL_2, IN_SEQ_PULSO },
            { OUT_PUL_INV, IN_ALE_PULSO },
            { OUT_SEQ_ST5, IN_SEQ_REINICIO },
            { OUT_SEQ_A, IN_OSC1_FREC },
            { OUT_ALE_ESC, IN_OSC1_MOD },
            { OUT_OSC1_TRI, IN_ENV_ENTRADA },
            { OUT_INT_SAL1, IN_ENV_CONTROL },
            { OUT_OSC1_RAMPA, IN_ANI_B },
            { OUT_OSC2_SEN, IN_ANI_A },
            { OUT_ANI_SAL1, IN_FIO_ENTRADA },
            { OUT_FIO_SUMA, IN_REV_E2 },
            { OUT_RUI_ROSA, IN_FIV_ENTRADA },
            { OUT_SEQ_B, IN_FIV_MOD },
            { OUT_FIV_BANDA, IN_REV_E1 },
            { OUT_ENV_S1, IN_SAL_IZQ },
            { OUT_REV_SAL1, IN_SAL_DER },
        };
        list.push_back(p);
    }

    // 2. Teclado (Playable MIDI / Keyboard Lead)
    {
        FactoryPatch p;
        p.name = "2 · Teclado";
        p.cables = {
            { OUT_TEC_VOLT, IN_OSC1_FREC },
            { OUT_OSC2_SEN, IN_OSC1_MOD },
            { OUT_OSC1_RAMPA, IN_FIV_ENTRADA },
            { OUT_TEC_PULSO, IN_INT_PULSO },
            { OUT_INT_SAL1, IN_FIV_MOD },
            { OUT_FIV_BAJOS, IN_ENV_ENTRADA },
            { OUT_INT_SAL2, IN_ENV_CONTROL },
            { OUT_ENV_S1, IN_SAL_IZQ },
            { OUT_ENV_S2, IN_REV_E1 },
            { OUT_REV_SAL1, IN_SAL_DER },
        };
        p.osc1Freq = 261.63f; p.osc1Mod = 0.02f;
        p.osc2Freq = 5.4f;
        p.fivCentro = 420.0f; p.fivAncho = 0.26f; p.fivMod = 3.1f;
        p.intAtaque = 0.006f; p.intDuracion = 0.12f; p.intDecaimiento = 0.42f;
        p.envMod = 0.92f;
        p.revIntensidad = 0.32f; p.revTiempo = 0.62f;
        p.tecPortamento = 0.03f;
        list.push_back(p);
    }

    // 3. Bajo 8p
    {
        FactoryPatch p;
        p.name = "3 · Bajo 8p";
        p.cables = {
            { OUT_PUL_1, IN_SEQ_PULSO },
            { OUT_SEQ_ST8, IN_SEQ_REINICIO },
            { OUT_SEQ_PULSO, IN_INT_PULSO },
            { OUT_SEQ_A, IN_OSC1_FREC },
            { OUT_OSC1_CUAD, IN_FIV_ENTRADA },
            { OUT_INT_SAL1, IN_FIV_MOD },
            { OUT_SEQ_B, IN_FIV_ANCHO_CV },
            { OUT_FIV_BAJOS, IN_ENV_ENTRADA },
            { OUT_INT_SAL2, IN_ENV_CONTROL },
            { OUT_ENV_S1, IN_SAL_IZQ },
            { OUT_ENV_S2, IN_REV_E1 },
            { OUT_REV_SAL1, IN_SAL_DER },
        };
        p.pulsadorReloj = 5.2f; p.pulsadorAncho = 0.45f;
        p.osc1Freq = 65.41f; p.osc1Ancho = 0.32f; p.osc1Mod = 0.0f;
        p.fivCentro = 180.0f; p.fivAncho = 0.38f; p.fivMod = 3.4f;
        p.intAtaque = 0.005f; p.intDuracion = 0.04f; p.intDecaimiento = 0.16f;
        p.revIntensidad = 0.18f; p.revTiempo = 0.45f;
        p.seqA = { 0, 0, 12, 7, 3, 5, 10, 7, 0, 0 };
        list.push_back(p);
    }

    // 4. Campanas
    {
        FactoryPatch p;
        p.name = "4 · Campanas";
        p.cables = {
            { OUT_PUL_1, IN_SEQ_PULSO },
            { OUT_SEQ_ST7, IN_SEQ_REINICIO },
            { OUT_SEQ_PULSO, IN_INT_PULSO },
            { OUT_SEQ_A, IN_OSC1_FREC },
            { OUT_OSC1_SEN, IN_ANI_A },
            { OUT_OSC2_SEN, IN_ANI_B },
            { OUT_ANI_SAL1, IN_FIO_ENTRADA },
            { OUT_FIO_SUMA, IN_ENV_ENTRADA },
            { OUT_INT_SAL1, IN_ENV_CONTROL },
            { OUT_ENV_S1, IN_REV_E1 },
            { OUT_ENV_S2, IN_SAL_IZQ },
            { OUT_REV_SAL1, IN_SAL_DER },
        };
        p.pulsadorReloj = 2.6f;
        p.osc1Freq = 329.63f; p.osc2Freq = 517.0f;
        p.anilloNivel = 0.9f;
        p.intAtaque = 0.005f; p.intDuracion = 0.03f; p.intDecaimiento = 0.95f;
        p.fioGains = { 0.1f, 0.15f, 0.2f, 0.3f, 0.5f, 0.7f, 0.95f, 0.9f, 0.85f, 0.7f };
        p.revIntensidad = 0.65f; p.revTiempo = 0.85f;
        list.push_back(p);
    }

    // 5. Aleatorio
    {
        FactoryPatch p;
        p.name = "5 · Aleatorio";
        p.cables = {
            { OUT_INT_PULSO, IN_ALE_PULSO },
            { OUT_ALE_ESC, IN_OSC1_FREC },
            { OUT_ALE_SUAVE, IN_OSC1_MOD },
            { OUT_OSC1_TRI, IN_FIV_ENTRADA },
            { OUT_INT_SAL1, IN_FIV_MOD },
            { OUT_FIV_BANDA, IN_ENV_ENTRADA },
            { OUT_INT_SAL2, IN_ENV_CONTROL },
            { OUT_ENV_S1, IN_REV_E1 },
            { OUT_REV_SAL1, IN_SAL_IZQ },
            { OUT_REV_SAL2, IN_SAL_DER },
        };
        p.intAutoCycle = true;
        p.intAtaque = 0.04f; p.intDuracion = 0.08f; p.intDecaimiento = 0.35f;
        p.osc1Freq = 220.0f; p.osc1Mod = 0.25f;
        p.fivCentro = 480.0f; p.fivAncho = 0.22f; p.fivMod = 2.8f;
        p.revIntensidad = 0.55f; p.revTiempo = 0.78f;
        list.push_back(p);
    }

    // 6. Formantes
    {
        FactoryPatch p;
        p.name = "6 · Formantes";
        p.cables = {
            { OUT_TEC_VOLT, IN_OSC1_FREC },
            { OUT_OSC1_RAMPA, IN_FIO_ENTRADA },
            { OUT_FIO_SUMA, IN_REV_E1 },
            { OUT_RUI_ROSA, IN_FIV_ENTRADA },
            { OUT_FIV_BANDA, IN_REV_E2 },
            { OUT_REV_SAL1, IN_SAL_IZQ },
            { OUT_REV_SAL2, IN_SAL_DER },
        };
        p.osc1Freq = 130.81f; p.osc1Mod = 0.0f;
        p.fioGains = { 0.1f, 0.2f, 0.4f, 0.85f, 0.35f, 0.95f, 0.25f, 0.85f, 0.2f, 0.15f };
        p.fioSuma = 0.85f;
        p.fivCentro = 1100.0f; p.fivAncho = 0.18f;
        p.revIntensidad = 0.52f; p.revTiempo = 0.76f;
        list.push_back(p);
    }

    // 7. Percusión
    {
        FactoryPatch p;
        p.name = "7 · Percusión";
        p.cables = {
            { OUT_PUL_1, IN_SEQ_PULSO },
            { OUT_SEQ_PULSO, IN_INT_PULSO },
            { OUT_INT_SAL1, IN_OSC1_MOD },
            { OUT_OSC1_SEN, IN_ENV_ENTRADA },
            { OUT_INT_SAL2, IN_ENV_CONTROL },
            { OUT_RUI_BLANCO, IN_FIV_ENTRADA },
            { OUT_SEQ_B, IN_FIV_MOD },
            { OUT_FIV_ALTOS, IN_REV_E1 },
            { OUT_ENV_S1, IN_SAL_IZQ },
            { OUT_REV_SAL1, IN_SAL_DER },
        };
        p.pulsadorReloj = 6.5f;
        p.osc1Freq = 52.0f; p.osc1Mod = 0.65f;
        p.intAtaque = 0.005f; p.intDuracion = 0.015f; p.intDecaimiento = 0.14f;
        p.fivCentro = 3200.0f; p.fivAncho = 0.35f; p.fivMod = 1.8f;
        p.revIntensidad = 0.22f; p.revTiempo = 0.38f;
        p.seqSw = { true, false, true, true, false, true, false, true, true, false };
        list.push_back(p);
    }

    // 8. Cosmos
    {
        FactoryPatch p;
        p.name = "8 · Cosmos";
        p.cables = {
            { OUT_INT_SAL1, IN_OSC2_MOD },
            { OUT_OSC2_SEN, IN_OSC1_MOD },
            { OUT_OSC1_SEN, IN_ANI_A },
            { OUT_OSC2_TRI, IN_ANI_B },
            { OUT_ANI_SAL1, IN_FIV_ENTRADA },
            { OUT_ALE_SUAVE, IN_FIV_MOD },
            { OUT_FIV_BANDA, IN_REV_E1 },
            { OUT_RUI_ROSA, IN_FIO_ENTRADA },
            { OUT_FIO_SUMA, IN_REV_E2 },
            { OUT_REV_SAL1, IN_SAL_IZQ },
            { OUT_REV_SAL2, IN_SAL_DER },
        };
        p.intAutoCycle = true;
        p.intAtaque = 2.4f; p.intDuracion = 1.2f; p.intDecaimiento = 3.2f;
        p.osc1Freq = 110.0f; p.osc1Mod = 0.35f;
        p.osc2Freq = 0.45f; p.osc2Mod = 0.2f;
        p.anilloNivel = 0.85f;
        p.fivCentro = 340.0f; p.fivAncho = 0.14f; p.fivMod = 2.6f;
        p.revIntensidad = 0.78f; p.revTiempo = 0.92f;
        list.push_back(p);
    }

    return list;
}

// Complete 14-module modular rack with zero-allocation audio-rate cable matrix
struct OmnifonRack {
    EnvolvedorDSP envolvedor;
    AleatorDSP aleator;
    AnilloDSP anillo;
    RuidorDSP ruidor;
    ReverberalDSP reverberal;
    IntegradorDSP integrador;
    OsciladorDSP osc1, osc2;
    FiltroVDSP filtrov;
    FiltroODSP filtroo;
    PulsadorDSP pulsador;
    SecuenciadorDSP secuenciador;
    TecladoDSP teclado;
    SalidaDSP salida;

    std::array<OutPin, NUM_IN_PINS> routing {};
    std::array<float, NUM_OUT_PINS> bus {};

    void prepare(double sampleRate) {
        aleator.prepare(sampleRate);
        anillo.prepare(sampleRate);
        reverberal.prepare(sampleRate);
        integrador.prepare(sampleRate);
        osc1.prepare(sampleRate);
        osc2.prepare(sampleRate);
        filtrov.prepare(sampleRate);
        filtroo.prepare(sampleRate);
        pulsador.prepare(sampleRate);
        secuenciador.reset();
        teclado.prepare(sampleRate);
        bus.fill(0.0f);
    }

    void setCables(const std::vector<Cable>& cables) {
        routing.fill(OUT_NONE);
        secuenciador.resetAtStep = -1;
        for (const auto& c : cables) {
            if (c.to >= 0 && c.to < NUM_IN_PINS && c.from >= 0 && c.from < NUM_OUT_PINS) {
                routing[static_cast<size_t>(c.to)] = c.from;
                if (c.to == IN_SEQ_REINICIO && c.from >= OUT_SEQ_ST0 && c.from <= OUT_SEQ_ST9) {
                    secuenciador.resetAtStep = static_cast<int>(c.from - OUT_SEQ_ST0);
                }
            }
        }
    }

    void applyPatch(const FactoryPatch& p) {
        setCables(p.cables);
        pulsador.reloj = p.pulsadorReloj;
        pulsador.ancho = p.pulsadorAncho;
        osc1.frecuencia = p.osc1Freq;
        osc1.modulador = p.osc1Mod;
        osc1.ancho = p.osc1Ancho;
        osc2.frecuencia = p.osc2Freq;
        osc2.modulador = p.osc2Mod;
        anillo.nivel = p.anilloNivel;
        integrador.ataque = p.intAtaque;
        integrador.duracion = p.intDuracion;
        integrador.decaimiento = p.intDecaimiento;
        integrador.autoCycle = p.intAutoCycle;
        envolvedor.nivel = p.envNivel;
        envolvedor.mod = p.envMod;
        filtrov.centro = p.fivCentro;
        filtrov.corte = p.fivCorte;
        filtrov.ancho = p.fivAncho;
        filtrov.modulacion = p.fivMod;
        filtroo.corte = p.fioCorte;
        filtroo.suma = p.fioSuma;
        filtroo.gains = p.fioGains;
        reverberal.intensidad = p.revIntensidad;
        reverberal.tiempo = p.revTiempo;
        teclado.portamento = p.tecPortamento;
        salida.volumen = p.salVolumen;
        for (size_t i = 0; i < 10; ++i) {
            secuenciador.s[i] = p.seqA[i] / 24.0f;
            secuenciador.s[10 + i] = p.seqB[i];
            secuenciador.s[20 + i] = p.seqC[i];
            secuenciador.sw[i] = p.seqSw[i];
        }
        secuenciador.reset();
    }

    inline float readIn(InPin pin) const noexcept {
        return bus[static_cast<size_t>(routing[static_cast<size_t>(pin)])];
    }
    inline bool hasIn(InPin pin) const noexcept {
        return routing[static_cast<size_t>(pin)] != OUT_NONE;
    }

    void processSample(const DawSyncInfo& sync, float& outL, float& outR) noexcept {
        // 1. Teclado
        teclado.process(bus[OUT_TEC_VOLT], bus[OUT_TEC_PULSO]);

        // 2. Pulsador (with DAW Sync!)
        pulsador.process(
            readIn(IN_PUL_INICIO), readIn(IN_PUL_FIN),
            readIn(IN_PUL_ANCHO_CV), hasIn(IN_PUL_ANCHO_CV),
            readIn(IN_PUL_RELOJ_CV), hasIn(IN_PUL_RELOJ_CV),
            sync,
            bus[OUT_PUL_1], bus[OUT_PUL_2], bus[OUT_PUL_INV]);

        // 3. Secuenciador
        std::array<float, 10> seqSteps {};
        secuenciador.process(
            readIn(IN_SEQ_PULSO), readIn(IN_SEQ_REINICIO),
            bus[OUT_SEQ_PULSO], bus[OUT_SEQ_A], bus[OUT_SEQ_B], bus[OUT_SEQ_C], bus[OUT_SEQ_VOLT],
            seqSteps);
        for (int k = 0; k < 10; ++k) bus[OUT_SEQ_ST0 + k] = seqSteps[static_cast<size_t>(k)];

        // 4. Aleator & Ruidor
        aleator.process(hasIn(IN_ALE_PULSO), readIn(IN_ALE_PULSO), bus[OUT_ALE_ESC], bus[OUT_ALE_SUAVE]);
        ruidor.process(bus[OUT_RUI_BLANCO], bus[OUT_RUI_ROSA]);

        // 5. Integrador Envolv.
        integrador.process(readIn(IN_INT_PULSO), bus[OUT_INT_SAL1], bus[OUT_INT_SAL2], bus[OUT_INT_PULSO]);

        // 6. Oscilador 1 & 2
        osc1.process(readIn(IN_OSC1_FREC), readIn(IN_OSC1_MOD),
                     bus[OUT_OSC1_SEN], bus[OUT_OSC1_TRI], bus[OUT_OSC1_RAMPA], bus[OUT_OSC1_CUAD]);
        osc2.process(readIn(IN_OSC2_FREC), readIn(IN_OSC2_MOD),
                     bus[OUT_OSC2_SEN], bus[OUT_OSC2_TRI], bus[OUT_OSC2_RAMPA], bus[OUT_OSC2_CUAD]);

        // 7. Mod. Anular
        anillo.process(readIn(IN_ANI_A), hasIn(IN_ANI_B), readIn(IN_ANI_B),
                       hasIn(IN_ANI_MOD), readIn(IN_ANI_MOD),
                       bus[OUT_ANI_SAL1], bus[OUT_ANI_SAL2]);

        // 8. Filtro-V
        filtrov.process(readIn(IN_FIV_ENTRADA), readIn(IN_FIV_ANCHO_CV),
                        readIn(IN_FIV_CONTROL), readIn(IN_FIV_MOD),
                        bus[OUT_FIV_BAJOS], bus[OUT_FIV_ALTOS], bus[OUT_FIV_BANDA]);

        // 9. Filtro-O
        std::array<float, 10> fioBands {};
        filtroo.process(readIn(IN_FIO_ENTRADA), bus[OUT_FIO_SUMA], fioBands);
        for (int b = 0; b < 10; ++b) bus[OUT_FIO_B0 + b] = fioBands[static_cast<size_t>(b)];

        // 10. Envolvedor
        envolvedor.process(readIn(IN_ENV_ENTRADA), readIn(IN_ENV_CONTROL), bus[OUT_ENV_S1], bus[OUT_ENV_S2]);

        // 11. Reverberal
        reverberal.process(readIn(IN_REV_E1), readIn(IN_REV_E2), bus[OUT_REV_SAL1], bus[OUT_REV_SAL2]);

        // 12. Salida
        salida.process(hasIn(IN_SAL_IZQ), readIn(IN_SAL_IZQ),
                       hasIn(IN_SAL_DER), readIn(IN_SAL_DER),
                       outL, outR);
    }
};

} // namespace omnifon
