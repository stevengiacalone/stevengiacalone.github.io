# stevengiacalone.github.io

Personal website of Steven Giacalone. A small, hand-written Jekyll site that GitHub Pages
builds automatically on every push. No theme, no framework, no web fonts.

## Where things live

| To change…                         | Edit                                   |
| ---------------------------------- | -------------------------------------- |
| Name, title, links, email, address | `_config.yml` (the `author:` block)    |
| About paragraphs                   | `index.html`                           |
| Research cards on the home page    | `_data/research.yml`                   |
| Long-form research page            | `research.html`                        |
| Positions, education, awards, telescope time, teaching, mentoring, service, outreach, talks | `_data/experience.yml` |
| Publications                       | `_publications/*.md` (one file per paper) |
| Colours, spacing, type             | `css/site.css` (tokens at the top)     |
| Star-field background              | `js/sky.js`                            |

### Adding a paper

Copy any file in `_publications/`, rename it, and update the front matter. The body is the
abstract. Put the PDF in `files/`.

```yaml
---
title: "Paper title"
collection: publications
permalink: /publication/Giacalone_etal_2026
excerpt: 'One-sentence summary shown on the paper page.'
date: 2026-03-01
year: 2026
venue: 'The Astronomical Journal'
journal: "AJ"            # tag on the list: AJ, ApJ, ApJL, ApJS, PASP (add a colour in site.css for others)
volume: "171, 12"
paperurl: '/files/Giacalone_etal_2026.pdf'
ads: "https://ui.adsabs.harvard.edu/abs/…/abstract"
layout: paper
authors:
  - "S. Giacalone"
  - "A. Coauthor"
  - "et al."
---
Abstract text…
```

Papers are grouped by `year` and sorted by `date`, newest first. `S. Giacalone` is bolded
automatically.

### Institution badges

Each position/education entry shows a small coloured badge (`mark` + `hue`). To use a real
logo instead, drop an image in `images/logos/` and add `logo: /images/logos/caltech.png`
to that entry.

## Old URLs

`/publications/`, `/cv/`, `/resume/`, `/contact/`, `/about/` and `/outreach/` redirect to the
matching section of the home page. `/research/` and `/publication/<paper>` still exist.

## Preview locally

```
bundle install
bundle exec jekyll serve
```
