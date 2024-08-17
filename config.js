let state = arguments[0] || {}
let params = arguments[1] || {}

// Room geometry, based on the origin in the centre of the floor. 

// these are the final output resolutions
// (why are the render resolutions they used different?)
// player1 192.168.100.51 floor
let res_floor = [1920, 3240]
// player3 192.168.100.53 right wall:
let res_wallR = [3840, 2160] // which is made up of:
let res_wallR0 = [3840, 1080]
let res_wallR1 = [3840, 725]
let res_wallR2 = [3840, 355]
// player2 92.168.100.52 left wall:
// left wall is the same res, but there is no L2 (just blank)
let res_wallL = res_wallR // which is made up of:
let res_wallL0 = res_wallR0
let res_wallL1 = res_wallR1
//let res_wallL2 = res_wallR2 // but this is blank.
// Server 192.168.100.54, far wall:
let res_wallF = [1920, 1080]

let mm_floor = [7.750, 15.790]
let mm_wallF = [7.750, 6.900]

let mm_wall0 = [15.790, 5.345]


return {
    meters: {
        x: 7.750,
        y: 6.900,
        y0: 5.345,
        z: 15.790,

        // // estimate size of gable section
        // y_gable: 2.85, //3.58, // 2.85, // 3.58??  
        // // estimated angle in radians
        // a_gable: 0.95, // 1, // 0.95,
        // // horizontal distance from wall to top section:
        // x_top: 2.350, // 2.9965, // 2.350, 
        // w_top: 3.050, //1.757, //3.050, //1.757

        // estimate size of gable section
        y_gable: 3.58, // 2.85, // 3.58??  
        // estimated angle in radians
        a_gable: 1.1, // 0.95,
        // horizontal distance from wall to top section:
        x_top: 2.9965, // 2.350, 
        w_top: 1.757, //3.050, //1.757
    },
    machines: {
        "192.168.100.51": {
            name: "floor",
            res: res_floor
        },
        "192.168.100.52": {
            name: "leftwall",
            res: res_wallL
        },
        "192.168.100.53": {
            name: "rightwall",
            res: res_wallR
        },
        "192.168.100.54": {
            name: "farwall",
            res: res_wallF
        },
    }
}