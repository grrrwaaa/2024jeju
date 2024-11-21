return {
    _seq: [
        {
            _name: "devel",
            _time: 600,
            u_descend: 0,
            u_grain: 0.01, // up to 0.03

            u_gamma: 1.2,
            u_lightness: 0.6,
            u_hue: 0.61,
            u_huerange: 0.15,
            u_saturation: 0.7,

            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.9, 
            u_aura_spawn : 0.6,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.,

            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 30.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 0.63,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.1,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.18,

            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 3,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 0.5,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 4,

            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.1,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.97,
        },


        // {
        //     _name: "start",
        //     _time: 0,
        //     u_descend: 0,
        //     u_grain: 0.1,

        //     u_gamma: 0.8,
        //     u_lightness: 0.9,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.5,
        // },

        // {
        //     _name: "begin descent",
        //     _time: 2.5 * 60,
        //     u_descend: 0,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.59,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "transion_start",
        //     _time: 3 * 60,
        //     u_descend: -10,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.32,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "discovery",
        //     _time: 3.5 * 60,
        //     u_descend: 0,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.32,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "exploraton_awe",
        //     _time: 6 * 60,
        //     u_descend: 0,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.32,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "play",
        //     _time: 8 * 60,
        //     u_descend: 5,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.32,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "fade out",
        //     _time: 9.5 * 60,
        //     u_descend: 5,
        //     u_grain: 0.1,

        //     u_gamma: 1.2,
        //     u_lightness: 0.32,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.7,
        // },

        // {
        //     _name: "end",
        //     _time: 10 * 60,
        //     u_descend: 0,
        //     u_grain: 0.1,

        //     u_gamma: 0.8,
        //     u_lightness: 0.9,
        //     u_hue: 0.61,
        //     u_huerange: 0.15,
        //     u_saturation: 0.,
        // },
    ]
}