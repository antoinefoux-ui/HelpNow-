/* eslint-disable @typescript-eslint/naming-convention */
exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add password_hash column to users table
  pgm.addColumn('users', {
    password_hash: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
  });
  
  console.log('✅ Added password_hash column to users table');
};

exports.down = (pgm) => {
  // Remove password_hash column if we need to rollback
  pgm.dropColumn('users', 'password_hash');
  
  console.log('❌ Removed password_hash column from users table');
};
