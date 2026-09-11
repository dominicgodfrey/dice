// Bright stars and constellation figures for the chart (PLAN.md D38).
// J2000 positions: RA in hours, Dec in degrees, visual magnitude. Enough
// to recognise the sky over Waltham; not a survey.

export type Star = {
  id: string;
  ra: number;
  dec: number;
  mag: number;
  con: string;
};

// [id, ra, dec, mag, constellation]
const S: [string, number, number, number, string][] = [
  // Ursa Major
  ["dubhe", 11.062, 61.75, 1.8, "UMa"],
  ["merak", 11.031, 56.38, 2.4, "UMa"],
  ["phecda", 11.897, 53.69, 2.4, "UMa"],
  ["megrez", 12.257, 57.03, 3.3, "UMa"],
  ["alioth", 12.9, 55.96, 1.8, "UMa"],
  ["mizar", 13.399, 54.93, 2.2, "UMa"],
  ["alkaid", 13.792, 49.31, 1.9, "UMa"],
  // Ursa Minor
  ["polaris", 2.53, 89.26, 2.0, "UMi"],
  ["yildun", 17.537, 86.59, 4.4, "UMi"],
  ["eps-umi", 16.766, 82.04, 4.2, "UMi"],
  ["zet-umi", 15.734, 77.79, 4.3, "UMi"],
  ["kochab", 14.845, 74.16, 2.1, "UMi"],
  ["pherkad", 15.345, 71.83, 3.0, "UMi"],
  ["eta-umi", 16.292, 75.76, 5.0, "UMi"],
  // Cassiopeia
  ["caph", 0.153, 59.15, 2.3, "Cas"],
  ["schedar", 0.675, 56.54, 2.2, "Cas"],
  ["gam-cas", 0.945, 60.72, 2.2, "Cas"],
  ["ruchbah", 1.43, 60.24, 2.7, "Cas"],
  ["segin", 1.907, 63.67, 3.4, "Cas"],
  // Cepheus
  ["alderamin", 21.31, 62.59, 2.5, "Cep"],
  ["alfirk", 21.478, 70.56, 3.2, "Cep"],
  ["errai", 23.656, 77.63, 3.2, "Cep"],
  ["iot-cep", 22.828, 66.2, 3.5, "Cep"],
  ["zet-cep", 22.181, 58.2, 3.4, "Cep"],
  // Orion
  ["betelgeuse", 5.919, 7.41, 0.5, "Ori"],
  ["bellatrix", 5.419, 6.35, 1.6, "Ori"],
  ["mintaka", 5.533, -0.3, 2.2, "Ori"],
  ["alnilam", 5.603, -1.2, 1.7, "Ori"],
  ["alnitak", 5.679, -1.94, 1.8, "Ori"],
  ["saiph", 5.796, -9.67, 2.1, "Ori"],
  ["rigel", 5.242, -8.2, 0.1, "Ori"],
  ["meissa", 5.585, 9.93, 3.4, "Ori"],
  // Taurus
  ["aldebaran", 4.599, 16.51, 0.9, "Tau"],
  ["elnath", 5.438, 28.61, 1.7, "Tau"],
  ["zet-tau", 5.627, 21.14, 3.0, "Tau"],
  ["gam-tau", 4.33, 15.63, 3.7, "Tau"],
  ["del-tau", 4.382, 17.54, 3.8, "Tau"],
  ["eps-tau", 4.477, 19.18, 3.5, "Tau"],
  ["the-tau", 4.478, 15.87, 3.4, "Tau"],
  ["alcyone", 3.791, 24.11, 2.9, "Tau"],
  // Gemini
  ["castor", 7.577, 31.89, 1.6, "Gem"],
  ["pollux", 7.755, 28.03, 1.1, "Gem"],
  ["alhena", 6.629, 16.4, 1.9, "Gem"],
  ["wasat", 7.335, 21.98, 3.5, "Gem"],
  ["mebsuta", 6.732, 25.13, 3.0, "Gem"],
  ["tejat", 6.383, 22.51, 2.9, "Gem"],
  ["propus", 6.248, 22.51, 3.3, "Gem"],
  // Auriga
  ["capella", 5.278, 46.0, 0.1, "Aur"],
  ["menkalinan", 5.992, 44.95, 1.9, "Aur"],
  ["the-aur", 5.995, 37.21, 2.6, "Aur"],
  ["iot-aur", 4.95, 33.17, 2.7, "Aur"],
  ["eps-aur", 5.033, 43.82, 3.0, "Aur"],
  // Canis Major / Minor
  ["sirius", 6.752, -16.72, -1.5, "CMa"],
  ["mirzam", 6.378, -17.96, 2.0, "CMa"],
  ["adhara", 6.977, -28.97, 1.5, "CMa"],
  ["wezen", 7.14, -26.39, 1.8, "CMa"],
  ["aludra", 7.402, -29.3, 2.4, "CMa"],
  ["procyon", 7.655, 5.22, 0.4, "CMi"],
  ["gomeisa", 7.452, 8.29, 2.9, "CMi"],
  // Leo
  ["regulus", 10.14, 11.97, 1.4, "Leo"],
  ["denebola", 11.818, 14.57, 2.1, "Leo"],
  ["algieba", 10.333, 19.84, 2.0, "Leo"],
  ["zosma", 11.235, 20.52, 2.6, "Leo"],
  ["chertan", 11.237, 15.43, 3.3, "Leo"],
  ["adhafera", 10.278, 23.42, 3.4, "Leo"],
  ["rasalas", 9.879, 26.01, 3.9, "Leo"],
  ["eps-leo", 9.764, 23.77, 3.0, "Leo"],
  ["eta-leo", 10.122, 16.76, 3.5, "Leo"],
  // Boötes
  ["arcturus", 14.261, 19.18, -0.1, "Boo"],
  ["izar", 14.75, 27.07, 2.4, "Boo"],
  ["muphrid", 13.911, 18.4, 2.7, "Boo"],
  ["seginus", 14.535, 38.31, 3.0, "Boo"],
  ["nekkar", 15.032, 40.39, 3.5, "Boo"],
  ["rho-boo", 14.53, 30.37, 3.6, "Boo"],
  ["del-boo", 15.258, 33.31, 3.5, "Boo"],
  // Corona Borealis
  ["alphecca", 15.578, 26.71, 2.2, "CrB"],
  ["nusakan", 15.464, 29.11, 3.7, "CrB"],
  ["gam-crb", 15.712, 26.3, 3.8, "CrB"],
  ["del-crb", 15.826, 26.07, 4.6, "CrB"],
  ["eps-crb", 15.959, 26.88, 4.1, "CrB"],
  ["the-crb", 15.549, 31.36, 4.1, "CrB"],
  // Hercules
  ["rasalgethi", 17.244, 14.39, 3.1, "Her"],
  ["kornephoros", 16.503, 21.49, 2.8, "Her"],
  ["zet-her", 16.688, 31.6, 2.8, "Her"],
  ["eta-her", 16.715, 38.92, 3.5, "Her"],
  ["pi-her", 17.251, 36.81, 3.2, "Her"],
  ["eps-her", 17.005, 30.93, 3.9, "Her"],
  ["del-her", 17.251, 24.84, 3.1, "Her"],
  // Lyra
  ["vega", 18.616, 38.78, 0.0, "Lyr"],
  ["sheliak", 18.835, 33.36, 3.5, "Lyr"],
  ["sulafat", 18.982, 32.69, 3.2, "Lyr"],
  ["del-lyr", 18.908, 36.9, 4.3, "Lyr"],
  ["zet-lyr", 18.746, 37.61, 4.4, "Lyr"],
  ["eps-lyr", 18.739, 39.67, 4.7, "Lyr"],
  // Cygnus
  ["deneb", 20.69, 45.28, 1.3, "Cyg"],
  ["sadr", 20.37, 40.26, 2.2, "Cyg"],
  ["albireo", 19.512, 27.96, 3.1, "Cyg"],
  ["gienah-cyg", 20.77, 33.97, 2.5, "Cyg"],
  ["del-cyg", 19.75, 45.13, 2.9, "Cyg"],
  ["iot-cyg", 19.495, 51.73, 3.8, "Cyg"],
  ["kap-cyg", 19.285, 53.37, 3.8, "Cyg"],
  // Aquila
  ["altair", 19.846, 8.87, 0.8, "Aql"],
  ["tarazed", 19.771, 10.61, 2.7, "Aql"],
  ["alshain", 19.922, 6.41, 3.7, "Aql"],
  ["del-aql", 19.425, 3.11, 3.4, "Aql"],
  ["zet-aql", 19.09, 13.86, 3.0, "Aql"],
  ["the-aql", 20.188, -0.82, 3.2, "Aql"],
  ["lam-aql", 19.102, -4.88, 3.4, "Aql"],
  // Delphinus
  ["sualocin", 20.66, 15.91, 3.8, "Del"],
  ["rotanev", 20.626, 14.6, 3.6, "Del"],
  ["gam-del", 20.777, 16.12, 4.3, "Del"],
  ["del-del", 20.724, 15.07, 4.4, "Del"],
  ["eps-del", 20.553, 11.3, 4.0, "Del"],
  // Scorpius
  ["antares", 16.49, -26.43, 1.0, "Sco"],
  ["dschubba", 16.005, -22.62, 2.3, "Sco"],
  ["acrab", 16.091, -19.81, 2.6, "Sco"],
  ["pi-sco", 15.981, -26.11, 2.9, "Sco"],
  ["sig-sco", 16.353, -25.59, 2.9, "Sco"],
  ["tau-sco", 16.598, -28.21, 2.8, "Sco"],
  ["eps-sco", 16.836, -34.29, 2.3, "Sco"],
  ["mu-sco", 16.864, -38.05, 3.0, "Sco"],
  ["zet-sco", 16.909, -42.36, 3.6, "Sco"],
  ["eta-sco", 17.203, -43.24, 3.3, "Sco"],
  ["sargas", 17.622, -42.99, 1.9, "Sco"],
  ["iot-sco", 17.793, -40.13, 3.0, "Sco"],
  ["kap-sco", 17.708, -39.03, 2.4, "Sco"],
  ["shaula", 17.56, -37.1, 1.6, "Sco"],
  ["lesath", 17.513, -37.3, 2.7, "Sco"],
  // Sagittarius
  ["kaus-australis", 18.403, -34.38, 1.8, "Sgr"],
  ["kaus-media", 18.35, -29.83, 2.7, "Sgr"],
  ["kaus-borealis", 18.466, -25.42, 2.8, "Sgr"],
  ["nunki", 18.921, -26.3, 2.0, "Sgr"],
  ["ascella", 19.043, -29.88, 2.6, "Sgr"],
  ["alnasl", 18.096, -30.42, 3.0, "Sgr"],
  ["phi-sgr", 18.761, -26.99, 3.2, "Sgr"],
  ["tau-sgr", 19.116, -27.67, 3.3, "Sgr"],
  // Pegasus / Andromeda
  ["markab", 23.079, 15.21, 2.5, "Peg"],
  ["scheat", 23.063, 28.08, 2.4, "Peg"],
  ["algenib", 0.22, 15.18, 2.8, "Peg"],
  ["enif", 21.736, 9.88, 2.4, "Peg"],
  ["matar", 22.717, 30.22, 2.9, "Peg"],
  ["mu-peg", 22.833, 24.6, 3.5, "Peg"],
  ["the-peg", 22.17, 6.2, 3.5, "Peg"],
  ["zet-peg", 22.691, 10.83, 3.4, "Peg"],
  ["alpheratz", 0.14, 29.09, 2.1, "And"],
  ["mirach", 1.162, 35.62, 2.1, "And"],
  ["almach", 2.065, 42.33, 2.2, "And"],
  ["del-and", 0.656, 30.86, 3.3, "And"],
  ["mu-and", 0.946, 38.5, 3.9, "And"],
  // Perseus
  ["mirfak", 3.405, 49.86, 1.8, "Per"],
  ["algol", 3.136, 40.96, 2.1, "Per"],
  ["gam-per", 3.08, 53.51, 2.9, "Per"],
  ["del-per", 3.715, 47.79, 3.0, "Per"],
  ["eps-per", 3.964, 40.01, 2.9, "Per"],
  ["zet-per", 3.902, 31.88, 2.9, "Per"],
  ["rho-per", 3.086, 38.84, 3.4, "Per"],
  ["eta-per", 2.845, 55.9, 3.8, "Per"],
  ["kap-per", 3.158, 44.86, 3.8, "Per"],
  // Aries
  ["hamal", 2.12, 23.46, 2.0, "Ari"],
  ["sheratan", 1.911, 20.81, 2.6, "Ari"],
  ["mesarthim", 1.892, 19.29, 3.9, "Ari"],
  ["41-ari", 2.833, 27.26, 3.6, "Ari"],
  // Virgo
  ["spica", 13.42, -11.16, 1.0, "Vir"],
  ["vindemiatrix", 13.036, 10.96, 2.8, "Vir"],
  ["porrima", 12.694, -1.45, 2.7, "Vir"],
  ["auva", 12.927, 3.4, 3.4, "Vir"],
  ["zavijava", 11.845, 1.76, 3.6, "Vir"],
  ["heze", 13.578, -0.6, 3.4, "Vir"],
  ["eta-vir", 12.332, -0.67, 3.9, "Vir"],
  // Libra
  ["zubenelgenubi", 14.848, -16.04, 2.8, "Lib"],
  ["zubeneschamali", 15.283, -9.38, 2.6, "Lib"],
  ["brachium", 15.068, -25.28, 3.3, "Lib"],
  ["gam-lib", 15.592, -14.79, 3.9, "Lib"],
  // Ophiuchus
  ["rasalhague", 17.582, 12.56, 2.1, "Oph"],
  ["cebalrai", 17.724, 4.57, 2.8, "Oph"],
  ["sabik", 17.173, -15.72, 2.4, "Oph"],
  ["zet-oph", 16.619, -10.57, 2.6, "Oph"],
  ["del-oph", 16.239, -3.69, 2.7, "Oph"],
  ["eps-oph", 16.305, -4.69, 3.2, "Oph"],
  ["kap-oph", 16.961, 9.38, 3.2, "Oph"],
  // Draco
  ["eltanin", 17.943, 51.49, 2.2, "Dra"],
  ["rastaban", 17.507, 52.3, 2.8, "Dra"],
  ["nu-dra", 17.537, 55.18, 4.9, "Dra"],
  ["xi-dra", 17.892, 56.87, 3.7, "Dra"],
  ["del-dra", 19.209, 67.66, 3.1, "Dra"],
  ["zet-dra", 17.146, 65.71, 3.2, "Dra"],
  ["eta-dra", 16.4, 61.51, 2.7, "Dra"],
  ["edasich", 15.415, 58.97, 3.3, "Dra"],
  ["thuban", 14.073, 64.38, 3.7, "Dra"],
  ["kap-dra", 12.558, 69.79, 3.9, "Dra"],
  ["lam-dra", 11.523, 69.33, 3.8, "Dra"],
  // Corvus, Hydra, Cetus, Capricornus, Aquarius, Piscis Austrinus
  ["gienah-crv", 12.263, -17.54, 2.6, "Crv"],
  ["algorab", 12.498, -16.52, 2.9, "Crv"],
  ["kraz", 12.573, -23.4, 2.7, "Crv"],
  ["minkar", 12.169, -22.62, 3.0, "Crv"],
  ["alphard", 9.46, -8.66, 2.0, "Hya"],
  ["zet-hya", 8.923, 5.95, 3.1, "Hya"],
  ["eps-hya", 8.78, 6.42, 3.4, "Hya"],
  ["del-hya", 8.628, 5.7, 4.1, "Hya"],
  ["diphda", 0.727, -17.99, 2.0, "Cet"],
  ["menkar", 3.038, 4.09, 2.5, "Cet"],
  ["mira", 2.323, -2.98, 3.0, "Cet"],
  ["gam-cet", 2.722, 3.24, 3.5, "Cet"],
  ["the-cet", 1.4, -8.18, 3.6, "Cet"],
  ["algedi", 20.301, -12.54, 3.6, "Cap"],
  ["dabih", 20.35, -14.78, 3.1, "Cap"],
  ["gam-cap", 21.668, -16.66, 3.7, "Cap"],
  ["deneb-algedi", 21.784, -16.13, 2.9, "Cap"],
  ["sadalmelik", 22.096, -0.32, 3.0, "Aqr"],
  ["sadalsuud", 21.526, -5.57, 2.9, "Aqr"],
  ["fomalhaut", 22.961, -29.62, 1.2, "PsA"],
];

export const STARS: readonly Star[] = S.map(([id, ra, dec, mag, con]) => ({
  id,
  ra,
  dec,
  mag,
  con,
}));

export const STAR_BY_ID: ReadonlyMap<string, Star> = new Map(
  STARS.map((s) => [s.id, s]),
);

export type Constellation = { abbr: string; name: string; lines: string[][] };

export const CONSTELLATIONS: readonly Constellation[] = [
  {
    abbr: "UMa",
    name: "Ursa Major",
    lines: [
      [
        "alkaid",
        "mizar",
        "alioth",
        "megrez",
        "dubhe",
        "merak",
        "phecda",
        "megrez",
      ],
    ],
  },
  {
    abbr: "UMi",
    name: "Ursa Minor",
    lines: [
      [
        "polaris",
        "yildun",
        "eps-umi",
        "zet-umi",
        "kochab",
        "pherkad",
        "eta-umi",
        "zet-umi",
      ],
    ],
  },
  {
    abbr: "Cas",
    name: "Cassiopeia",
    lines: [["caph", "schedar", "gam-cas", "ruchbah", "segin"]],
  },
  {
    abbr: "Cep",
    name: "Cepheus",
    lines: [
      ["alderamin", "alfirk", "errai", "iot-cep", "zet-cep", "alderamin"],
    ],
  },
  {
    abbr: "Ori",
    name: "Orion",
    lines: [
      [
        "betelgeuse",
        "bellatrix",
        "mintaka",
        "alnilam",
        "alnitak",
        "betelgeuse",
      ],
      ["mintaka", "rigel", "saiph", "alnitak"],
      ["betelgeuse", "meissa", "bellatrix"],
    ],
  },
  {
    abbr: "Tau",
    name: "Taurus",
    lines: [
      [
        "elnath",
        "eps-tau",
        "del-tau",
        "gam-tau",
        "the-tau",
        "aldebaran",
        "zet-tau",
      ],
    ],
  },
  {
    abbr: "Gem",
    name: "Gemini",
    lines: [
      ["castor", "mebsuta", "tejat", "propus"],
      ["pollux", "wasat", "alhena"],
      ["mebsuta", "wasat"],
    ],
  },
  {
    abbr: "Aur",
    name: "Auriga",
    lines: [
      [
        "capella",
        "menkalinan",
        "the-aur",
        "elnath",
        "iot-aur",
        "eps-aur",
        "capella",
      ],
    ],
  },
  {
    abbr: "CMa",
    name: "Canis Major",
    lines: [
      ["mirzam", "sirius", "wezen", "adhara"],
      ["wezen", "aludra"],
    ],
  },
  { abbr: "CMi", name: "Canis Minor", lines: [["procyon", "gomeisa"]] },
  {
    abbr: "Leo",
    name: "Leo",
    lines: [
      ["regulus", "eta-leo", "algieba", "adhafera", "rasalas", "eps-leo"],
      ["algieba", "zosma", "denebola", "chertan", "regulus"],
      ["zosma", "chertan"],
    ],
  },
  {
    abbr: "Boo",
    name: "Boötes",
    lines: [
      ["arcturus", "muphrid"],
      [
        "arcturus",
        "izar",
        "del-boo",
        "nekkar",
        "seginus",
        "rho-boo",
        "arcturus",
      ],
    ],
  },
  {
    abbr: "CrB",
    name: "Corona Borealis",
    lines: [
      ["the-crb", "nusakan", "alphecca", "gam-crb", "del-crb", "eps-crb"],
    ],
  },
  {
    abbr: "Her",
    name: "Hercules",
    lines: [
      ["eps-her", "zet-her", "eta-her", "pi-her", "eps-her"],
      ["zet-her", "kornephoros"],
      ["eps-her", "del-her", "rasalgethi"],
    ],
  },
  {
    abbr: "Lyr",
    name: "Lyra",
    lines: [
      ["vega", "zet-lyr", "sheliak", "sulafat", "del-lyr", "zet-lyr"],
      ["vega", "eps-lyr"],
    ],
  },
  {
    abbr: "Cyg",
    name: "Cygnus",
    lines: [
      ["deneb", "sadr", "albireo"],
      ["gienah-cyg", "sadr", "del-cyg", "iot-cyg", "kap-cyg"],
    ],
  },
  {
    abbr: "Aql",
    name: "Aquila",
    lines: [
      ["tarazed", "altair", "alshain", "the-aql"],
      ["altair", "del-aql", "lam-aql"],
      ["del-aql", "zet-aql"],
    ],
  },
  {
    abbr: "Del",
    name: "Delphinus",
    lines: [
      ["sualocin", "rotanev", "del-del", "gam-del", "sualocin"],
      ["rotanev", "eps-del"],
    ],
  },
  {
    abbr: "Sco",
    name: "Scorpius",
    lines: [
      ["acrab", "dschubba", "pi-sco"],
      [
        "dschubba",
        "sig-sco",
        "antares",
        "tau-sco",
        "eps-sco",
        "mu-sco",
        "zet-sco",
        "eta-sco",
        "sargas",
        "iot-sco",
        "kap-sco",
        "shaula",
        "lesath",
      ],
    ],
  },
  {
    abbr: "Sgr",
    name: "Sagittarius",
    lines: [
      [
        "alnasl",
        "kaus-media",
        "kaus-australis",
        "ascella",
        "phi-sgr",
        "kaus-media",
        "kaus-borealis",
        "phi-sgr",
        "nunki",
        "tau-sgr",
        "ascella",
      ],
    ],
  },
  {
    abbr: "Peg",
    name: "Pegasus",
    lines: [
      ["markab", "scheat", "alpheratz", "algenib", "markab"],
      ["markab", "zet-peg", "the-peg", "enif"],
      ["scheat", "matar"],
      ["scheat", "mu-peg"],
    ],
  },
  {
    abbr: "And",
    name: "Andromeda",
    lines: [
      ["alpheratz", "del-and", "mirach", "almach"],
      ["mirach", "mu-and"],
    ],
  },
  {
    abbr: "Per",
    name: "Perseus",
    lines: [
      ["eta-per", "gam-per", "mirfak", "del-per", "eps-per", "zet-per"],
      ["mirfak", "kap-per", "algol", "rho-per"],
    ],
  },
  {
    abbr: "Ari",
    name: "Aries",
    lines: [["41-ari", "hamal", "sheratan", "mesarthim"]],
  },
  {
    abbr: "Vir",
    name: "Virgo",
    lines: [
      ["zavijava", "eta-vir", "porrima", "auva", "vindemiatrix"],
      ["porrima", "heze", "spica"],
    ],
  },
  {
    abbr: "Lib",
    name: "Libra",
    lines: [
      [
        "zubenelgenubi",
        "zubeneschamali",
        "gam-lib",
        "zubenelgenubi",
        "brachium",
      ],
    ],
  },
  {
    abbr: "Oph",
    name: "Ophiuchus",
    lines: [
      [
        "rasalhague",
        "cebalrai",
        "sabik",
        "zet-oph",
        "eps-oph",
        "del-oph",
        "kap-oph",
        "rasalhague",
      ],
    ],
  },
  {
    abbr: "Dra",
    name: "Draco",
    lines: [
      ["eltanin", "rastaban", "nu-dra", "xi-dra", "eltanin"],
      [
        "xi-dra",
        "del-dra",
        "zet-dra",
        "eta-dra",
        "edasich",
        "thuban",
        "kap-dra",
        "lam-dra",
      ],
    ],
  },
  {
    abbr: "Crv",
    name: "Corvus",
    lines: [["gienah-crv", "algorab", "kraz", "minkar", "gienah-crv"]],
  },
  {
    abbr: "Hya",
    name: "Hydra",
    lines: [["del-hya", "eps-hya", "zet-hya", "alphard"]],
  },
  {
    abbr: "Cet",
    name: "Cetus",
    lines: [["menkar", "gam-cet", "mira", "the-cet", "diphda"]],
  },
  {
    abbr: "Cap",
    name: "Capricornus",
    lines: [["algedi", "dabih", "gam-cap", "deneb-algedi"]],
  },
  { abbr: "Aqr", name: "Aquarius", lines: [["sadalsuud", "sadalmelik"]] },
  { abbr: "PsA", name: "Piscis Austrinus", lines: [] },
];

export const CONSTELLATION_BY_ABBR: ReadonlyMap<string, Constellation> =
  new Map(CONSTELLATIONS.map((c) => [c.abbr, c]));

/** A few stars worth naming on the chart. */
export const NAMED: Record<string, string> = {
  sirius: "Sirius",
  arcturus: "Arcturus",
  vega: "Vega",
  capella: "Capella",
  rigel: "Rigel",
  procyon: "Procyon",
  betelgeuse: "Betelgeuse",
  altair: "Altair",
  aldebaran: "Aldebaran",
  antares: "Antares",
  spica: "Spica",
  pollux: "Pollux",
  fomalhaut: "Fomalhaut",
  deneb: "Deneb",
  regulus: "Regulus",
  polaris: "Polaris",
};
