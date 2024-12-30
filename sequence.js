function load(s, time) {
    return Object.assign({
        _time: time,
        _filename: s,
    }, new Function(fs.readFileSync("sequence/" + s, "utf-8"))())
}

return {
    _seq: [
        {
            _name: "ink",
            _time: 0, // departure A
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 1,
        
            // visual intensities:
            u_final_pressure: 0.5, //88,
            u_final_aura: 0.5,
            u_final_trails: 0.3,
            u_final_creatures: 0.0,
        
            // colors:
            u_creatures_hsl: [0.6, 0.7, -0.3],
            u_creatures_hsl_inside: [0.6667, 0.6, -0.2],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            // 0+, 0.4 was norm
            u_drift_amount: 0.1,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.03,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.9999,
            u_fluid_matter_decay: 0.9999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.5, 
            u_aura_spawn : 0.0,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.01,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 10.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.0,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.0,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 0.9,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 0,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.1,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.05,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.75,
        },

        {
            _name: "descend",
            _time: 60, // A to Discovery
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.4,
            u_final_creatures: 0.1,
        
            // colors:
            u_creatures_hsl: [0.5, 0.7, 0.5],
            u_creatures_hsl_inside: [0.6, 1, 0.4],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.9],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.9, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.6, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.2, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: -0.5,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.0,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.9999,
            u_fluid_matter_decay: 0.99999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.97, 
            u_aura_spawn : 0.3,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.05,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 50.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.01,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.1,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 5,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 2,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.5,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.97,
        },

        {
            _name: "pink blobs masses with fingers",
            _time: 180, // 3 min, B to Chanllenge
            
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.1,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.27,
            u_final_creatures: 0.75,

            // colors:
            u_creatures_hsl: [0.5, 0.7, 0.4],
            u_creatures_hsl_inside: [0.6667, 1, 0.3],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.55],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.01,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.96, 
            u_aura_spawn : 0.75,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.2,
        
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
            u_drift_effect_speed : 1, //0.75,
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
            u_decay_rate : 0.93,
        },

        {
            _name: "pink blobs masses with fingers",
            _time: 240, // 4 min Challenge to Owe
            
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.1,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.27,
            u_final_creatures: 0.75,

            // colors:
            u_creatures_hsl: [0,33, 0.9, 0.3],
            u_creatures_hsl_inside: [0.73, 0.9, 0.5],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.55],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.01,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.96, 
            u_aura_spawn : 0.75,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.2,
        
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
            u_drift_effect_speed : 1, //0.75,
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
            u_decay_rate : 0.93,
        },
        {
            _name: "wild pink blobs",
            _time: 330, //5 min 30 secons, owe
            
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.1,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.27,
            u_final_creatures: 0.75,
        
            // colors:
            u_creatures_hsl: [0.6667, 0.8, 0.4],
            u_creatures_hsl_inside: [0.75, 0.6, 0.8],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.55],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.01,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.96, 
            u_aura_spawn : 0.8,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.05,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 30.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 0.63,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.1,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.2,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 3,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1, //0.75,
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
            u_decay_rate : 0.94,
        },
        {
            _name: "blue dust and thready spinners",
            _time: 400, //6 min 30 sec, Owe to Wild playfulness
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.2,
            u_final_creatures: 0.75,

            // colors:
            u_creatures_hsl: [0.75, 0.9, 0.3],
            u_creatures_hsl_inside: [0.833, 0.4, 1],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0.2,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.01,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
            u_fluid_velocity_decay: 1,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0.96, 
            u_aura_spawn : 0.,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.4,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 10.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.05,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.01,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 4,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.1,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 2,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.99,
        },
        {
            _name: "hairy trails",
            _time: 450, // 7 min 30 sec , Wild Playfulness
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.4,
            u_final_creatures: 0.,
        
            // colors:
            u_creatures_hsl: [0.776, 0.4, 0.88],
            u_creatures_hsl_inside: [0.886, 0.3, 1],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            u_drift_amount: 0.4,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.01,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
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
            u_sensor_distance : 10.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.0,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.0,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 5,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 2,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.5,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.9,
        },
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
            u_final_creatures: 0.05,
        
            // colors:
            u_creatures_hsl: [0.083, 0.6, 0.8],
            u_creatures_hsl_inside: [0.333, 0.3, 1],
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
            u_grain: 0.015,
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
        },
        {
            _name: "storm!",
            _time: 580, // 9 min 40 cm, homecoming
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,
            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 0,
        
            // visual intensities:
            u_final_pressure: 0.5,
            u_final_aura: 0.5,
            u_final_trails: 0.3,
            u_final_creatures: 0.1,
        
            // colors:
            u_creatures_hsl: [0.333, 0.7, 0.4],
            u_creatures_hsl_inside: [0.5, 0.8, 0.6],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.2, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            u_drift_amount: 0.8,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.005,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1.0,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0.99999,
            u_fluid_matter_decay: 0.99999,
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
            u_sensor_distance : 40.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.01,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.01,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 2,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.8,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 2,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.2,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.9,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.91,
        },
        {
            _name: "end",
            _time: 600, // home
        
            // overall contrast -- 1 is no change, >1 is deeper contrast (darker darks), <1 is softer (lighter)
            u_gamma: 1.2,            // color intensity; 1 is no change, 0 is greyscale, 2 is oversaturated
            u_saturation: 1,
            u_ink_mode: 1,
        
            // visual intensities:
            u_final_pressure: 0.5, //88,
            u_final_aura: 0.5,
            u_final_trails: 0.3,
            u_final_creatures: 0.0,
        
            // colors:
            u_creatures_hsl: [0.5, 1, 0.3],
            u_creatures_hsl_inside: [0.6667, 0.9, 0.5],
            // base color of ocean (hue, sat, lightness in 0..1)
            u_ocean_hsl: [0.6, 0.5, 0.6],
            // how this varies by vertical 
            u_ocean_hsl_variation: [0., 0.5, 0.2],
            // base color of aura (hue, sat, lightness in 0..1)
            u_aura_hsl: [0.4, 0.8, 0.8],
            // how this varies by aura intensity:
            u_aura_hsl_variation: [-0.5, 0., 0.],
            
            // behaviours:
        
            // -8 to 8? if we are descending or rising in the ocean. 0 means neither, negative is descending
            u_descend: 0,
            // 0+, 0.4 was norm
            u_drift_amount: 0.1,
        
            // 0-0.03: amount of sandy dust in the fluid currents
            // setting to 0 will create more glassy smooth surface but also let human currents travel farther; feels more deep oceah
            u_grain: 0.03,
            // 0 or 1, changes how the fluid currents travel; subtle effect but I like 1 better than 0
            u_fluid_mode: 1,
            // should be 1 or very slightly less than 1. Probably 1 is ok. 
            u_fluid_pressure_decay: 0,
            u_fluid_matter_decay: 0,
            u_fluid_velocity_decay: 0,
        
            // creatures:
            // 0..1
            // higher values make it more likely to spawn on (caustics/auras)
            u_caustic_spawn : 0., 
            u_aura_spawn : 0.5,
            // 0..1
            // if > 0, limits new spawns to be near older ones
            // this will tend to reduce their population
            u_spawn_threshold : 0.,
        
            // how they sense:
            // smaller makes their trails narrower
            // larger (hundreds) makes them more like flocks
            u_sensor_distance : 10.,
            // 0..pi. smaller means they can't see behind them, so they  tend to create lines. larger means they can see all directions, more likely to make balls. 
            u_sensor_angle : 3.1,
            // 0 to about 0.3? how much they follow trails, 0 makes them senseless dust, about 0.1-0.2 they organize well, above that it gets messier
            u_turn_angle : 0.0,
            // 0 to about 0.5? how much they randomly wander. 0.2 feels good, 0.5 is messier
            u_wander_angle : 0.0,
        
            // how fast they move by different stimuli:
            // too high and they will die off. 
            // 0-6? following the fluid currents (e.g. human)
            u_fluid_effect_speed : 0.9,
            // 0..1, drifting with the ocean
            u_drift_effect_speed : 1.,
            // 0..6? speeding up when near a trail. Too high and they die off, too low and they don't feel alive
            u_trail_effect_speed : 0,
        
            // 0..0.2? how strongly they create their trails. too strong and the trails blow up
            u_deposit_rate : 0.,
            // 0..0.2? how much the trails spread in space
            // increasing this well tend to make them decay more quickly, so increase deposit_rate or decay_rate to compensate?
            u_blur_rate : 0.05,
            // 0..1, but usually 0.95+
            // how much their trails decay over time
            // if it is very close to 1 the trails tend to persist as large patterns
            u_decay_rate : 0.75,
        }
    ]
}