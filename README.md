# Terminus-2.0 Documentation

Static documentation site for **Project Terminus-2.0** by **Cognyzer**.

Live site: https://naveenkatiyar2001.github.io/terminus-2.0-docs/

## Local preview

```bash
cd terminus-2.0-docs
python3 -m http.server 8000
# open http://localhost:8000
```

## Rebuild from source

Source markdown lives in `Terminus-Edition-2/`. To regenerate the site, run
the build script in the parent workspace:

```bash
python3 build_site.py
```
