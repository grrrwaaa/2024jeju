function load(s, time) {
    return Object.assign({
        _time: time,
        _filename: s,
    }, new Function(fs.readFileSync("sequence/" + s, "utf-8"))())
}

return {
    _seq: [
        {
            _name: "ascend",
            _time: 520, // 8 min 40 seconds Adaptation to home coming
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.35,
            u_final_creatures: 0.5,
        
            // colors:
            u_creatures_hsl: [0.62, 0.55, 0.4],
            u_creatures_hsl_inside: [0.69, 0.88, 0.5],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.4, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            

            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0.5,
            u_drift_amount: 0.5,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0, //0.015,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.9999,
            u_fluid_matter_decay: 0.9999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.99, 
            u_aura_spawn : 0.9,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 25.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.01,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.001,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 3,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.4,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 3,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.7,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.9,
        }
    ]
}