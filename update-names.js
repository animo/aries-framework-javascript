const fs = require('fs/promises')
const path = require('path')

async function updatePackageNames() {
  try {
    const packagesDir = await fs.readdir('packages')

    for (const dir of packagesDir) {
      const packageJsonPath = path.join('packages', dir, 'package.json')
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8')
        const pkg = JSON.parse(content)
        if (pkg.name.startsWith('@credo-ts/')) {
          const baseName = pkg.name.replace('@credo-ts/', '')
          pkg.name = `@animo-id/credo-ts-${baseName}`
          fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2))
        }
      } catch (_error) {}
    }

    const changesets = await fs.readdir('.changeset')
    for (const item of changesets) {
      if (item.endsWith('.md')) {
        await fs.rm(path.join('.changeset', item))
      }
    }
  } catch (_error) {
    process.exit(1)
  }
}

updatePackageNames()
