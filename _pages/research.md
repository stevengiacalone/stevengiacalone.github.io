---
layout: archive
title: "Research"
permalink: /research/
author_profile: true
---

## Origin of Close-in Brown Dwarfs
-----------------------------------

Brown dwarfs, objects traditionally classified as having masses 13-80x that of Jupiter, are believed to form far from their host stars or free floating. The presence of brown dwarfs orbiting close to their host stars has therefore been a mystery since their discovery decades ago. Did these massive companions migrate inward from initial distant orbits or did they form in situ via some unknown mechanims? To answer this question, I use ground-based observations that reveal the orbits, host star properties, and atmospheric compositions of brown dwarfs.

### Orbital Tilts

The angle between the hot star spin axis and the planet orbital angular momentum vector, often referred to as "stellar obliquity," reveals the dynamical history of the planet (or brown dwarf, in my case). If these two angles are aligned, it mostly likely means the brown dwarf formed in and migrated through a protoplantary disk, similarly to a planet. If the aren't aligned, it most likely means the brown dwarf was "kicked" inward by another object or was dynamically captured by the star. To determine how close-in brown dwarfs arrived at their current orbits, I co-founded the OATMEAL survey, which is more than doubling the number of systems with stellar obliquity measurements and enabling population-level studies of brown dwarf orbits. To learn more, see [Giacalone et al. (2024)](https://stevengiacalone.github.io/files/Giacalone_etal_2024.pdf) and [Giacalone et al. (2025)](https://stevengiacalone.github.io/files/Giacalone_etal_2025a.pdf).

![](https://stevengiacalone.github.io/files/fig1.png)
*Figures from Giacalone et al. (2024) and Giacalone et al. (2025), which display the Doppler shadow of GPX-1b and Rossiter-McLaughlin effect signal of KELT-23Ab, respectively. These spectroscopic signals were used to calculate the stellar obliquities of the two systems.*

### Stellar Metallicities

The metallicities of stars correlate strongly with the prevalences of giant planets and low-mass stellar companions. Specifically, giant planets are more common around metal-rich stars whereas low-mass stellar companions are found around stars with a wide range of metallicities. This is likely because giant planet formation (accretion of gas onto a solid core) operates more efficiently in metal-rich environments and star formation (direct collapse of gas without a solid core) is largely independent of ambient metal content. In principle, one can determine if brown dwarfs form like giant planets or like stars by determining the companion mass at which the stellar metallicity distribution changes. In a submitted paper, we explore this question using data from the California Legacy Survey, a 30-year radial velocity survey that detected hundreds of planets and brown dwarfs.

![](https://stevengiacalone.github.io/files/fig2.png)
*Figure from Giacalone et al. (submitted), in which I find that the stellar metallicity distribution changes at a companion mass of ~27 Jupiter masses. Brown dwarfs less massive than this may have formed like giant planets.*

### Atmospheric Compositions

I am currently leading a survey to measure the atmospheric compositions of close-in brown dwarfs using high-resolution, near-infrared spectroscopy. The goal of the survey is to measure the carbon-to-oxygen abundance ratios for these objects, which are tracers of how and where they formed. By comparing these measurements to those of giant planets, we can determine if brown dwarfs and giant planets have similar formation mechanisms.

## Demographics of Small Planets around Hot Stars
-----------------------------------

For my PhD thesis, I calculated the prevalence of small planets orbiting close to A-type stars for the first time. A-type stars are hot stars that are roughly twice as large as the Sun. These properties may cause planets around these stars to have different properties as those around Sun-like stars, but they also make it more challenging to find planets in orbit around them. This challenge led early planet-hunting surveys (e.g., Kepler) to largely avoided them. Because TESS is observing all stars across nearly the entire sky, it allows us to finally study planets around A-type stars. In [Giacalone & Dressing (2025)](https://stevengiacalone.github.io/files/Giacalone_Dressing_2025.pdf), I found that planets smaller than Jupiter with orbital periods under 10 days are significantly more rare around A-type stars than cooler stars. This difference is likely to due to the fact that dust sublimates farther from A-type stars due to their high temperatures, which prevents small planets from forming in and migrating to these close-in orbits.

![](https://stevengiacalone.github.io/files/fig3.png)
*Figure from Giacalone & Dressing (2025), which shows the occurrence rate of sub-Neptune-size planets orbiting M-, K-, G-, F-, and A-type stars (left to right). The prevalence of these small planets decreases monatonically with increasing stellar effective temperature, indicating that the temperature of the inner protoplanetary disk may play an important role in determining whether or not planets can migrate close to the star.*

## Exoplanet Discovery with TESS
-----------------------------------

When TESS launched in 2018, it was predicted to detect thousands of both transiting planets and astrophysical false positives, phenomena like eclipsing binaries that mimic planet-like signals. While radial velocity measurements or transit timing variations can confirm genuine planets, limited telescope time and observational constraints make these approaches infeasible for most candidates. Recognizing this bottleneck, I developed TRICERATOPS, a Bayesian statistical tool that distinguishes true planets from false positives using TESS photometry alone ([Giacalone et al. 2021](https://stevengiacalone.github.io/files/Giacalone_etal_2021.pdf)). With TRICERATOPS, I discovered 13 rocky planets that are high-priority targets for JWST atmospheric characterization ([Giacalone et al. 2022a](https://stevengiacalone.github.io/files/Giacalone_etal_2022a.pdf)). I also discovered the Neptune-size planet HD 56414b, one of the only known sub-Jovian planets orbiting an A-type star ([Giacalone et al. 2022b](https://stevengiacalone.github.io/files/Giacalone_etal_2022b.pdf)). The tool, now responsible for the discovery of over 100 planets ($\sim 20\%$ of all planets found in TESS data), has since been widely adopted by the exoplanet community and continues to be used today.

To learn more about TRICERATOPS, check out its GitHub page [here](https://github.com/stevengiacalone/triceratops).

## Planet Formation and Evolution
-----------------------------------

We can learn about planet formation and evolution by comparing observations to theoretical models. In [Giacalone et al. (2017)](https://stevengiacalone.github.io/files/Giacalone_etal_2017.pdf) and [Konigl et al. (2017)](https://stevengiacalone.github.io/files/Konigl_etal_2017.pdf), I compared numerical simulations of high-eccentricity tidal migration, a mechanism for transporting planets from wide-separation orbits to close-in orbits, to the population of observed close-in planets. Through this experiment, we showed that this migration mechanism can reproduce the eccentricty distribution of hot Jupiters and the orbital period distribution of dynamically isolated rocky planets, shedding light on the presence of planets in regions where they are unable to form.

In [Giacalone et al. (2019)](https://stevengiacalone.github.io/files/Giacalone_etal_2019.pdf), I developed numerical simulations of dust being transported radially outward in protoplanetary disks via magnetocentrifugal winds. Outward transport is believed to occur in disks due to presence of calcium-aluminum-rich inclusions in carbonaceous chondrite meteorites and high levels of crystalline dust in the outer regions of protoplanetary disks, which could have only formed in high temperature environments like those close to the host star. I showed that this disk wind transport mechanism can explain the observed dust crystallinity fractions in the outer regions of protoplanetary disks, suggesting that it may play an important role in the planet formation process.
