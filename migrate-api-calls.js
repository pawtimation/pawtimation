#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

/**
 * Auto-migrate api() calls to role-specific wrappers
 * 
 * Rules:
 * - Files in /admin/ or AdminX.jsx → adminApi
 * - Files in /staff/ or StaffX.jsx → staffApi
 * - Files in /client/ or ClientX.jsx → clientApi
 * - Other business files → adminApi (default)
 * - Shared lib files → keep api() but add role parameter
 */

const roleMapping = {
  admin: 'adminApi',
  staff: 'staffApi',
  client: 'clientApi',
};

function detectRoleFromPath(filePath) {
  const path = filePath.toLowerCase();
  
  if (path.includes('/admin/') || path.includes('admin') && !path.includes('superadmin')) {
    return 'admin';
  }
  if (path.includes('/staff/') || path.includes('staff')) {
    return 'staff';
  }
  if (path.includes('/client/') || path.includes('client')) {
    return 'client';
  }
  if (path.includes('/business/') || path.includes('business') || path.includes('booking') || path.includes('invoice')) {
    return 'admin'; // Business operations default to admin
  }
  
  return null; // Shared lib - needs manual inspection
}

function migrateFile(filePath) {
  const role = detectRoleFromPath(filePath);
  if (!role) {
    console.log(`⏭️  Skipping ${filePath} - needs manual review (shared/lib file)`);
    return;
  }

  const apiWrapper = roleMapping[role];
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Check if file uses api()
  if (!content.includes('api(')) {
    console.log(`⏭️  Skipping ${filePath} - no api() calls found`);
    return;
  }

  // Update import statement to include role-specific wrapper
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"](.*\/lib\/auth)['"]/;
  const match = content.match(importRegex);

  if (match) {
    const imports = match[1].split(',').map(i => i.trim());
    if (!imports.includes(apiWrapper)) {
      imports.push(apiWrapper);
      const newImport = `import { ${imports.join(', ')} } from '${match[2]}'`;
      content = content.replace(importRegex, newImport);
      modified = true;
    }
  } else if (content.includes("from '../lib/auth'") || content.includes("from '../../lib/auth'") || content.includes("from '../../../lib/auth'")) {
    // Add import if it's importing from auth but doesn't have the pattern
    const authImportMatch = content.match(/(from\s*['"].*\/lib\/auth['"])/);
    if (authImportMatch) {
      const beforeImport = content.substring(0, authImportMatch.index);
      const lastImportLine = beforeImport.lastIndexOf('\n');
      const insertPos = lastImportLine === -1 ? 0 : lastImportLine + 1;
      
      // Check if there's already an import from auth
      const existingAuthImport = content.match(/import\s*{([^}]+)}\s*from\s*['"](.*\/lib\/auth)['"]/);
      if (existingAuthImport) {
        const imports = existingAuthImport[1].split(',').map(i => i.trim());
        if (!imports.includes(apiWrapper)) {
          imports.push(apiWrapper);
          const newImport = `import { ${imports.join(', ')} } from '${existingAuthImport[2]}'`;
          content = content.replace(existingAuthImport[0], newImport);
          modified = true;
        }
      }
    }
  }

  // Replace api( calls with apiWrapper(
  // Match: api('/path') or api('/path', {...})
  // Don't match: adminApi(, staffApi(, clientApi(, ownerApi(
  const apiCallRegex = /\bapi\(/g;
  const matches = content.match(apiCallRegex);
  
  if (matches) {
    // Replace all api( with the role-specific wrapper
    content = content.replace(/\bapi\(/g, `${apiWrapper}(`);
    modified = true;
    console.log(`✅ Migrated ${filePath} (${matches.length} calls) → ${apiWrapper}`);
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
  }
}

// Find all JSX files in apps/web/src
const files = glob.sync('apps/web/src/**/*.{js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

console.log(`🔍 Found ${files.length} files to analyze\n`);

let migratedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  const before = readFileSync(file, 'utf-8');
  migrateFile(file);
  const after = readFileSync(file, 'utf-8');
  
  if (before !== after) {
    migratedCount++;
  } else if (before.includes('api(')) {
    skippedCount++;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Migrated: ${migratedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files (need manual review)`);
console.log(`\n🎯 Next: Review skipped files and manually add role-specific wrappers`);
