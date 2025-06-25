# Documentation

This directory contains documentation assets for the Chat Application Backend project.

## Structure

```
docs/
└── images/                    # Documentation images and screenshots
    └── swagger-api-documentation.png  # Swagger UI screenshot
```

## Images

### swagger-api-documentation.png
Screenshot of the Swagger API documentation interface showing all available endpoints, request/response schemas, and authentication examples.

## Guidelines

- **Documentation images**: Store screenshots, diagrams, and other visual documentation assets in `docs/images/`
- **Naming convention**: Use descriptive, kebab-case names for image files
- **File formats**: Prefer PNG for screenshots, SVG for diagrams when possible
- **Size**: Keep images reasonably sized (under 2MB) for faster loading

## Adding New Images

1. Place the image file in the appropriate subdirectory under `docs/`
2. Use descriptive filenames (e.g., `api-flow-diagram.png`, `database-schema.svg`)
3. Reference the image in markdown files using relative paths: `![Description](docs/images/filename.png)`
4. Update this README if adding new categories or important images
