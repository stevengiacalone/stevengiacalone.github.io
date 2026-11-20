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
| CV (linked from the header and nav) | replace `files/CV_StevenGiacalone.pdf` (keep the name) |
| Publications                       | `_publications/*.md` (one file per paper) |
| Colours, spacing, type             | `css/site.css` (tokens at the top)     |
| Star-field background              | `js/sky.js`                            |

### Adding a paper

Copy any file in `_publications/`, rename it, and update the front matter. The body is the
abstract. Put the PDF in `files/`. Only papers with `first_author: true` appear in the list on
the home page; the others keep their pages so old links still work.

```yaml
---
title: "Paper title"
collection: publications
permalink: /publication/Giacalone_etal_2026
excerpt: 'One-sentence summary shown on the paper page.'
date: 2026-03-01
year: 2026
venue: 'The Astronomical Journal'
journal: "AJ"            # short journal name (not currently displayed)
volume: "171, 12"
paperurl: '/files/Giacalone_etal_2026.pdf'
scix: "https://scixplorer.org/abs/…/abstract"
layout: paper
first_author: true
authors:
  - "S. Giacalone"
  - "A. Coauthor"
  - "et al."
---
Abstract text…
```

Papers are grouped by `year` and sorted by `date`, newest first. `S. Giacalone` is bolded
automatically.

## Old URLs

`/publications/`, `/contact/` and `/about/` redirect to the matching section of the home page;
`/cv/` and `/resume/` go straight to the CV PDF; `/outreach/` goes to the home page. `/research/` and `/publication/<paper>` still exist.

## Preview locally

```
bundle install
bundle exec jekyll serve
```
