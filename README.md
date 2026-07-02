# Alp'Sciences — site web bilingue / bilingual website

> « De l'infiniment petit aux sommets »

Site statique du blog & portfolio d'**Hector Pillot**, habillé selon la **charte graphique
Alp'Sciences**, en **français** et **anglais**, prêt pour **GitHub Pages**.
URL de production : **https://alpsciences.fr**

---

## Structure des pages

Chaque page est un dossier avec son propre `index.html`, pour des URLs sans
`.html` (ex. `/projets/agora-des-sciences/`). Seules la racine
(`index.html` / `en/index.html`) et `404.html` restent des fichiers plats,
comme l'exigent les hébergeurs statiques.

| FR | EN | Description |
|----|-----|-------------|
| `index.html` (`/`) | `en/index.html` (`/en/`) | Accueil / Main (manuel, section blog auto-injectée) |
| `blog/` | `en/blog/` | Blog — liste des articles (généré) |
| `blog/<id>/` | `en/blog/<id>/` | Page d'article (générée) |
| `cv/` | `en/cv/` | CV & Portfolio (manuel) |
| `projets/` | `en/projects/` | Projets — galerie + frise (généré) |
| `projets/<id>/` | `en/projects/<id>/` | Page de projet (générée) |
| `contact/` | `en/contact/` | Contact (manuel) |
| `mentions-legales/` | `en/legal-notice/` | Mentions légales (manuel) |
| `404.html` | `en/404.html` | Page d'erreur (manuel, liens en chemins absolus) |
| `sitemap.xml` | — | Sitemap SEO (généré) |
| `robots.txt` | — | Robots SEO (manuel) |

Le header et le footer ne sont pas dupliqués dans chaque page : ils vivent
dans `partials/header-{fr,en}.html` et `partials/footer-{fr,en}.html`, et
`js/include.js` les injecte au chargement de chaque page (met en évidence le
lien actif, calcule les liens FR⇄EN et adapte le préfixe `../` selon la
profondeur du dossier).

---

## Générateur — `build.py`

Aucune dépendance : **Python 3 standard** suffit.

```bash
python3 build.py
```

Génère actuellement **~27 fichiers** (varie selon le nombre de projets et d'articles).
GitHub Pages n'exécute pas `build.py` — il sert le HTML statique déjà produit.
**Relancez `build.py` après chaque modification de la base de données.**

### Ce que génère `build.py`

| Sortie | Source |
|--------|--------|
| `projets/` + `en/projects/` | `data/projects.json` |
| `projets/<id>/` + `en/projects/<id>/` | `data/projects.json` |
| `blog/` + `en/blog/` | `data/posts.json` |
| `blog/<id>/` + `en/blog/<id>/` | `data/posts.json` |
| Section « Articles récents » dans `index.html` / `en/index.html` | `data/posts.json` (3 plus récents) |
| `sitemap.xml` | toutes les pages FR + EN |

Si `data/posts.json` est absent, le blog affiche un écran « bientôt disponible ».

---

## Base de données projets — `data/projects.json`

Tableau JSON, un objet par projet. Champs principaux :

| Champ | Description |
|-------|-------------|
| `id` | slug unique (nom du fichier HTML) |
| `sortDate` | `"YYYY-MM"` — classement chronologique |
| `title` / `title_en` | Titre FR / EN |
| `dateRange` / `dateRange_en` | Période affichée |
| `image` | URL ou chemin local |
| `abstract` / `abstract_en` | Résumé (affiché sur la liste et en tête de page) |
| `contexte` / `role` / `deroulement` / `resultats` | Sections HTML (+ variantes `_en`) |
| `tags` / `tags_en` | Tableaux de chaînes |
| `ressources` | `[{label, label_en, url}]` |
| `pinned` | `true` → article en tête de la galerie |

### Éditeur projets — `editeur-projets.html`

Ouvrir dans le navigateur (fichier local). Éditeur visuel FR|EN côte à côte :
- Glisser-déposer pour réordonner les projets dans la liste.
- Bouton 📌 pour épingler un projet (apparaît en premier dans la galerie).
- Importer un `.md` pour créer un projet depuis un fichier Markdown.
- Exporter → `data/projects.json` → `python3 build.py`.

---

## Base de données blog — `data/posts.json`

Tableau JSON, un objet par article :

| Champ | Description |
|-------|-------------|
| `id` | slug unique |
| `date` | `"YYYY-MM"` |
| `category` | `physique-des-particules` · `mediation-scientifique` · `montagnes` · `vie-associative` · `autre` |
| `coverImage` | URL ou chemin local |
| `title` / `title_en` | Titre FR / EN |
| `excerpt` / `excerpt_en` | Extrait court (liste + accueil) |
| `body` / `body_en` | Corps HTML complet de l'article |

### Éditeur blog — `editeur-blog.html`

Ouvrir dans le navigateur (fichier local). Même ergonomie que l'éditeur projets :
- Corps de l'article en blocs : **Paragraphe**, **Sous-titre**, **Liste**, **HTML brut**, **Grille**.
- **Bloc Grille** : choisir 1–4 colonnes × 1–4 lignes ; chaque cellule est un texte ou une image. Génère du HTML `.bk-grid` responsive (collapse en 1 colonne sous 600 px).
- Importer un `.md`, coller du Markdown, voir le HTML généré.
- Exporter → `data/posts.json` → `python3 build.py`.

---

## Vues projets

La page projets propose deux vues commutables :

| Vue | Description |
|-----|-------------|
| **Galerie** (défaut) | Grille CSS 2 colonnes, projets épinglés en premier |
| **Frise** | Frise chronologique verticale |

Le filtre par tag fonctionne dans les deux vues. La préférence est sauvegardée dans `localStorage`.

---

## Charte graphique

- **Typographie** : Libre Baskerville (Google Fonts)
- **Palette** : mauve vif `#8c57f6` · mauve `#4a2e6f` · or `#f1cb48` · or clair `#efcc83`
- **Fond** : crème `#f8f5ef`
- **Logo** : `assets/mark-dark.svg` / `assets/mark-light.svg` (favicon inclus)
- **Icônes sociales** : SVG masques CSS dans `css/style.css`
- Texte courant **justifié** (`text-align: justify; hyphens: auto`)

---

## Responsive

- Navigation mobile avec menu burger (≤ 860 px)
- Galerie projets : 2 colonnes ≥ 720 px, 1 colonne en dessous
- Grilles blog : collapse à 1 colonne (≤ 600 px)
- `.page-head` réduit à 88 px de padding supérieur sur mobile (≤ 640 px)

---

## SEO

- `<meta name="description">`, `<link rel="canonical">`, balises Open Graph sur toutes les pages générées
- `sitemap.xml` généré automatiquement avec priorités et fréquences
- `robots.txt` pointant vers le sitemap
- `mentions-legales/` / `en/legal-notice/` marquées `noindex`
- URL de base : `https://alpsciences.fr` (variable `BASE_URL` dans `build.py`)

---

## Déploiement GitHub Pages

```bash
git init && git add . && git commit -m "Alp'Sciences"
git branch -M main
git remote add origin https://github.com/<user>/alpsciences.git
git push -u origin main
```

**Settings → Pages → Deploy from a branch**, branche `main`, dossier `/ (root)`.

Le fichier `.nojekyll` est présent pour désactiver le traitement Jekyll.

---

## Workflow de mise à jour

```
┌─────────────────────┐     export JSON      ┌──────────────────┐
│ editeur-projets.html│ ──────────────────► │ data/projects.json│
│ editeur-blog.html   │                      │ data/posts.json   │
└─────────────────────┘                      └────────┬─────────┘
                                                      │ python3 build.py
                                                      ▼
                                             ┌──────────────────┐
                                             │  HTML statique   │
                                             │  (~27 fichiers)  │
                                             └────────┬─────────┘
                                                      │ git push
                                                      ▼
                                             https://alpsciences.fr
```

---

Contenu & marque © Hector Pillot · Alp'Sciences.
