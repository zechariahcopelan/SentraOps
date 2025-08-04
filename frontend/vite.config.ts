import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Type definitions for environment variables
interface SentraOpsEnv {
  VITE_API_URL: string;
  VITE_WEBSOCKET_URL: string;
  VITE_DEV_SERVER_HOST?: string;
  VITE_DEV_SERVER_PORT?: string;
  VITE_HMR_PORT?: string;
  VITE_APP_VERSION?: string;
  VITE_SOURCE_MAPS?: string;
  VITE_CHUNK_SIZE_WARNING_LIMIT?: string;
  VITE_CSS_CODE_SPLIT?: string;
  VITE_FORCE_OPTIMIZE?: string;
  VITE_USE_POLLING?: string;
  VITE_OPEN_BROWSER?: string;
  VITE_BUILD_OUTPUT_DIR?: string;
  VITE_TARGET_BROWSERS?: string;
  VITE_LOG_LEVEL?: string;
  VITE_CLEAR_SCREEN?: string;
  VITE_BASE_PATH?: string;
  VITE_PREVIEW_PORT?: string;
  VITE_PREVIEW_HOST?: string;
  VITE_EMIT_MANIFEST?: string;
  VITE_SSR_BUILD?: string;
  [key: string]: string | undefined;
}

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  // Load environment variables based on mode with proper typing
  const env = loadEnv(mode, process.cwd(), '') as SentraOpsEnv;
  
  // Check if we're in development mode
  const isDev = command === 'serve';
  const isProd = command === 'build';
  
  return {
    // Plugin configuration with TypeScript optimizations
    plugins: [
      react({
        // Enable Fast Refresh for better development experience
        fastRefresh: isDev,
        // React DevTools integration
        babel: {
          plugins: isDev ? ['babel-plugin-react-devtools'] : [],
          presets: [
            ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]
          ],
        },
        // TypeScript configuration
        include: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        // Enable React Strict Mode if configured
        jsxRuntime: 'automatic',
      }),
    ],

    // Path resolution and aliases with TypeScript support
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@store': path.resolve(__dirname, './src/store'),
        '@config': path.resolve(__dirname, './src/config'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@interfaces': path.resolve(__dirname, './src/interfaces'),
        '@constants': path.resolve(__dirname, './src/constants'),
      },
      // Ensure these extensions are resolved with TypeScript priority
      extensions: ['.ts', '.tsx', '.mts', '.js', '.mjs', '.jsx', '.json', '.vue'],
    },

    // Development server configuration
    server: {
      host: env.VITE_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(env.VITE_DEV_SERVER_PORT || '3000'),
      open: env.VITE_OPEN_BROWSER !== 'false',
      cors: true,
      
      // Enhanced proxy configuration for SentraOps backend
      proxy: {
        // Main API proxy with improved error handling
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err: Error, _req, _res) => {
              console.log('🚨 Proxy error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔄 Proxying request:', req.method, req.url);
              // Add custom headers for SentraOps
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
              proxyReq.setHeader('X-Real-IP', req.socket.remoteAddress || '');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
              // Add CORS headers for development
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
            });
          },
        },
        
        // WebSocket proxy for real-time features
        '/ws': {
          target: env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
          ws: true,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        
        // Health check proxy
        '/health': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        
        // Documentation proxy
        '/docs': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        
        // OpenAPI spec proxy
        '/openapi.json': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        
        // Static file proxy for uploads/downloads
        '/uploads': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        
        // Media files proxy
        '/media': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },

      // Hot Module Replacement configuration
      hmr: {
        port: parseInt(env.VITE_HMR_PORT || '24678'),
        overlay: isDev,
        // Enhanced HMR for TypeScript
        clientPort: parseInt(env.VITE_HMR_PORT || '24678'),
      },

      // File watching configuration optimized for TypeScript
      watch: {
        // Ignore node_modules for performance
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        // Use polling for better compatibility with some systems
        usePolling: env.VITE_USE_POLLING === 'true',
        // TypeScript-specific watching
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
      },

      // Middleware for TypeScript development
      middlewareMode: false,
    },

    // Preview server configuration (for production testing)
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT || '4173'),
      host: env.VITE_PREVIEW_HOST || '0.0.0.0',
      cors: true,
      open: env.VITE_OPEN_BROWSER !== 'false',
    },

    // Build configuration with TypeScript optimizations
    build: {
      // Output directory
      outDir: env.VITE_BUILD_OUTPUT_DIR || 'dist',
      
      // Generate sourcemaps for debugging TypeScript
      sourcemap: env.VITE_SOURCE_MAPS !== 'false',
      
      // Minification with TypeScript support
      minify: isProd ? 'esbuild' : false,
      
      // Target browsers with modern TypeScript support
      target: env.VITE_TARGET_BROWSERS || 'esnext',
      
      // Chunk size warning limit
      chunkSizeWarningLimit: parseInt(env.VITE_CHUNK_SIZE_WARNING_LIMIT || '1000'),
      
      // TypeScript checking during build
      write: true,
      emptyOutDir: true,
      
      // Rollup options for advanced bundling with TypeScript
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Manual chunks for better caching and TypeScript modules
          manualChunks: (id: string) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('lucide-react') || id.includes('@headlessui/react')) {
                return 'ui-vendor';
              }
              if (id.includes('recharts') || id.includes('react-globe.gl')) {
                return 'chart-vendor';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor';
              }
              if (id.includes('react-router-dom')) {
                return 'router-vendor';
              }
              if (id.includes('typescript') || id.includes('@types')) {
                return 'types-vendor';
              }
              return 'vendor';
            }
            
            // Feature-specific chunks based on file paths
            if (id.includes('/analytics/') || id.includes('analytics.')) {
              return 'analytics';
            }
            if (id.includes('/incidents/') || id.includes('incidents.')) {
              return 'incidents';
            }
            if (id.includes('/playbooks/') || id.includes('playbooks.')) {
              return 'playbooks';
            }
            if (id.includes('/geolocation/') || id.includes('geolocation.')) {
              return 'geolocation';
            }
            if (id.includes('/auth/') || id.includes('auth.')) {
              return 'auth';
            }
            if (id.includes('/dashboard/') || id.includes('dashboard.')) {
              return 'dashboard';
            }
            
            return undefined;
          },
          
          // Naming patterns for chunks with TypeScript support
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '')
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          entryFileNames: 'js/[name]-[hash].js',
        },
        
        // External dependencies (not bundled)
        external: [],
        
        // Preserve modules for better tree shaking
        preserveModules: false,
      },
      
      // CSS code splitting
      cssCodeSplit: env.VITE_CSS_CODE_SPLIT !== 'false',
      
      // CSS minification
      cssMinify: isProd,
      
      // Report compressed size
      reportCompressedSize: isProd,
      
      // Emit manifest for server-side rendering
      manifest: env.VITE_EMIT_MANIFEST === 'true',
      
      // SSR build options
      ssr: env.VITE_SSR_BUILD === 'true',
      
      // TypeScript-specific build options
      lib: undefined, // Not building a library
    },

    // CSS configuration with TypeScript module support
    css: {
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
        generateScopedName: isDev 
          ? '[name]__[local]___[hash:base64:5]'
          : '[hash:base64:5]',
        // TypeScript declaration for CSS modules
        exportGlobals: true,
      },
      
      // PostCSS configuration
      postcss: {
        plugins: [
          // Add Tailwind CSS and other PostCSS plugins here if needed
        ],
      },
      
      // Preprocessor options with TypeScript imports
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
          // Support for TypeScript-style imports in SCSS
          importer: [],
        },
        sass: {
          additionalData: `@import "@/styles/variables.sass"`,
        },
        less: {
          additionalData: `@import "@/styles/variables.less";`,
        },
      },
      
      // CSS dev sourcemaps
      devSourcemap: isDev,
    },

    // Dependency optimization with TypeScript considerations
    optimizeDeps: {
      // Include dependencies that should be pre-bundled
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        'recharts',
        'react-globe.gl',
        // TypeScript utility libraries
        'utility-types',
        'type-fest',
      ],
      
      // Exclude dependencies from pre-bundling
      exclude: [
        // TypeScript files should not be pre-bundled
        '@types/*',
      ],
      
      // Force optimization of certain dependencies
      force: env.VITE_FORCE_OPTIMIZE === 'true',
      
      // ESBuild options for dependency optimization
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true,
        },
      },
    },

    // Environment variable configuration
    envPrefix: ['VITE_', 'REACT_APP_'],
    envDir: process.cwd(),

    // Define global constants with proper TypeScript typing
    define: {
      // Global feature flags
      __DEV__: isDev,
      __PROD__: isProd,
      __VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      
      // Environment-specific globals
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_BUILD_MODE': JSON.stringify(mode),
      
      // TypeScript-specific globals
      __TYPESCRIPT__: true,
      __DEV_TOOLS__: isDev,
    } as Record<string, any>,

    // Esbuild configuration optimized for TypeScript
    esbuild: {
      // Drop console and debugger in production
      drop: isProd ? ['console', 'debugger'] : [],
      
      // TypeScript configuration
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          useDefineForClassFields: false,
          importsNotUsedAsValues: 'remove',
          preserveValueImports: false,
        },
      },
      
      // JSX factory for TypeScript
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      
      // Target JavaScript version
      target: 'esnext',
      
      // TypeScript-specific options
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
    },

    // TypeScript checking
    clearScreen: env.VITE_CLEAR_SCREEN !== 'false',

    // Worker configuration for web workers with TypeScript
    worker: {
      format: 'es',
      plugins: [
        react({
          include: /\.(tsx?|jsx?)$/,
        }),
      ],
    },

    // JSON configuration
    json: {
      namedExports: true,
      stringify: false,
    },

    // Asset handling with TypeScript module declarations
    assetsInclude: [
      // Additional file types to treat as assets
      '**/*.gltf',
      '**/*.glb', 
      '**/*.hdr',
      '**/*.exr',
      // TypeScript declaration files as assets if needed
      '**/*.d.ts',
    ],

    // Public directory configuration
    publicDir: 'public',

    // Base public path
    base: env.VITE_BASE_PATH || '/',

    // Log level with TypeScript-aware logging
    logLevel: (env.VITE_LOG_LEVEL as 'info' | 'warn' | 'error' | 'silent') || (isDev ? 'info' : 'warn'),

    // Experimental features
    experimental: {
      // Enable experimental features as needed
      renderBuiltUrl: (filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },

    // Advanced TypeScript-specific configurations
    appType: 'spa', // Single Page Application
    
    // Custom logger for TypeScript-aware error reporting
    customLogger: undefined, // Use default logger with TypeScript support
  };
});
