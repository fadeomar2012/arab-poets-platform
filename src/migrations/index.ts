import * as migration_20260719_163835_initial from './20260719_163835_initial';
import * as migration_20260720_110905_cms_hardening from './20260720_110905_cms_hardening';
import * as migration_20260720_122756_cms_runtime_fixes from './20260720_122756_cms_runtime_fixes';
import * as migration_20260720_164131_ui_ux_refactor from './20260720_164131_ui_ux_refactor';

export const migrations = [
  {
    up: migration_20260719_163835_initial.up,
    down: migration_20260719_163835_initial.down,
    name: '20260719_163835_initial',
  },
  {
    up: migration_20260720_110905_cms_hardening.up,
    down: migration_20260720_110905_cms_hardening.down,
    name: '20260720_110905_cms_hardening',
  },
  {
    up: migration_20260720_122756_cms_runtime_fixes.up,
    down: migration_20260720_122756_cms_runtime_fixes.down,
    name: '20260720_122756_cms_runtime_fixes',
  },
  {
    up: migration_20260720_164131_ui_ux_refactor.up,
    down: migration_20260720_164131_ui_ux_refactor.down,
    name: '20260720_164131_ui_ux_refactor'
  },
];
