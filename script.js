let dataMakanan = [];

fetch("data_makanan.csv")
  .then((res) => res.text())
  .then((text) => (dataMakanan = parseCSV(text)));

function parseCSV(csv) {
  let lines = csv.trim().split("\n");
  let headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    let v = line.split(",");
    return {
      nama: v[0],
      kategori: v[1],
      kalori: Number(v[2]),
      protein: Number(v[3]),
      lemak: Number(v[4]),
      karbohidrat: Number(v[5]),
    };
  });
}

function hitungGizi(umur, jk, bb, tb, aktivitas) {
  let bmi = bb / (tb / 100) ** 2;
  let bmr =
    jk === "laki-laki"
      ? 88.362 + 13.397 * bb + 4.799 * tb - 5.677 * umur
      : 447.593 + 9.247 * bb + 3.098 * tb - 4.33 * umur;

  let faktor = {
    "sangat ringan": 1.3,
    ringan: jk === "laki-laki" ? 1.56 : 1.55,
    sedang: jk === "laki-laki" ? 1.76 : 1.7,
    berat: jk === "laki-laki" ? 2.1 : 2.0,
  };

  let tee = bmr * faktor[aktivitas];

  return {
    tee,
    protein: (0.25 * tee) / 4,
    karbo: (0.45 * tee) / 4,
    lemak: (0.3 * tee) / 9,
  };
}

function buatKromosom() {
  let kategori = [
    "Makanan Pokok",
    "Lauk Pauk",
    "Sayur Mayur",
    "Buah",
    "Makanan Ringan",
  ];
  return kategori.map(
    (k) =>
      dataMakanan
        .filter((m) => m.kategori === k)
        .sort(() => 0.5 - Math.random())[0]
  );
}

function fitness(krom, target) {
  let t = { k: 0, p: 0, kh: 0, l: 0 };
  krom.forEach((m) => {
    t.k += m.kalori;
    t.p += m.protein;
    t.kh += m.karbohidrat;
    t.l += m.lemak;
  });
  let dev =
    Math.abs(t.k - target.tee) +
    Math.abs(t.p - target.protein) +
    Math.abs(t.kh - target.karbo) +
    Math.abs(t.l - target.lemak);
  return 1 / (dev + 0.0001);
}

function seleksi(pop, fit) {
  let a = Math.floor(Math.random() * pop.length);
  let b = Math.floor(Math.random() * pop.length);
  return fit[a] > fit[b] ? pop[a] : pop[b];
}

function crossover(p1, p2) {
  let t = Math.floor(Math.random() * p1.length);
  return p1.slice(0, t).concat(p2.slice(t));
}

function mutasi(krom) {
  let i = Math.floor(Math.random() * krom.length);
  let k = krom[i].kategori;
  krom[i] = dataMakanan
    .filter((m) => m.kategori === k)
    .sort(() => 0.5 - Math.random())[0];
  return krom;
}

function geneticAlgorithm(target) {
  let pop = Array.from({ length: 12 }, buatKromosom);

  let bestFitness = -1;
  let bestSolution = null;
  let bestGen = 0;
  let log = "";

  for (let g = 0; g < 80; g++) {
    let fit = pop.map((p) => fitness(p, target));

    let maxFit = Math.max(...fit);
    let idx = fit.indexOf(maxFit);

    log += `Generasi ${g} | Fitness terbaik: ${maxFit.toFixed(6)}<br>`;

    if (maxFit > bestFitness) {
      bestFitness = maxFit;
      bestSolution = pop[idx];
      bestGen = g;
    }

    let baru = [];
    for (let i = 0; i < 12; i++) {
      let p1 = seleksi(pop, fit);
      let p2 = seleksi(pop, fit);
      let anak = crossover(p1, p2);
      anak = mutasi(anak);
      baru.push(anak);
    }
    pop = baru;
  }

  document.getElementById("log").innerHTML = log;

  return {
    solusi: bestSolution,
    fitness: bestFitness,
    generasi: bestGen,
  };
}

function proses() {
  let target = hitungGizi(
    umur.value,
    jk.value,
    bb.value,
    tb.value,
    aktivitas.value
  );

  let hasilGA = geneticAlgorithm(target);
  let menu = hasilGA.solusi;

  let total = { kal: 0, pro: 0, kar: 0, lem: 0 };
  menu.forEach((m) => {
    total.kal += m.kalori;
    total.pro += m.protein;
    total.kar += m.karbohidrat;
    total.lem += m.lemak;
  });

  document.getElementById("hasil").innerHTML = `
        <h2>Hasil Akhir Genetic Algorithm</h2>

        <p><b>Fitness Terbaik:</b> ${hasilGA.fitness.toFixed(6)}</p>
        <p><b>Ditemukan pada Generasi ke-:</b> ${hasilGA.generasi}</p>

        <h3>Menu Terpilih</h3>
        <ul>
            ${menu
              .map(
                (m) => `
                <li>
                    ${m.nama} (${m.kategori}) |
                    Kal: ${m.kalori},
                    P: ${m.protein},
                    KH: ${m.karbohidrat},
                    L: ${m.lemak}
                </li>
            `
              )
              .join("")}
        </ul>

        <h3>Total Gizi Menu</h3>
        <p>Kalori: ${total.kal.toFixed(2)} kkal (Target: ${target.tee.toFixed(
    2
  )})</p>
        <p>Protein: ${total.pro.toFixed(2)} g (Target: ${target.protein.toFixed(
    2
  )})</p>
        <p>Karbohidrat: ${total.kar.toFixed(
          2
        )} g (Target: ${target.karbo.toFixed(2)})</p>
        <p>Lemak: ${total.lem.toFixed(2)} g (Target: ${target.lemak.toFixed(
    2
  )})</p>
    `;
}
