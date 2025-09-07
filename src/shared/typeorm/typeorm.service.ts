import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from "typeorm";
import * as fs from 'fs';


@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const sslConfig = this.getSslConfig();
    
    // Log connection details (without password)
    console.log('🔍 Database connection configuration:');
    console.log('Host:', this.config.get<string>('DATABASE_HOST'));
    console.log('Port:', this.config.get<number>('DATABASE_PORT'));
    console.log('Database:', this.config.get<string>('DATABASE_NAME'));
    console.log('Username:', this.config.get<string>('DATABASE_USER'));
    console.log('SSL Config:', {
      ssl: sslConfig.ssl ? {
        ca: sslConfig.ssl.ca ? '[CERTIFICATE LOADED]' : '[NO CERTIFICATE]',
        rejectUnauthorized: sslConfig.ssl.rejectUnauthorized
      } : '[NO SSL CONFIG]'
    });
    
    const config = {
      type: 'postgres' as const,
      host: this.config.get<string>('DATABASE_HOST'),
      port: this.config.get<number>('DATABASE_PORT'),
      database: this.config.get<string>('DATABASE_NAME'),
      username: this.config.get<string>('DATABASE_USER'),
      password: this.config.get<string>('DATABASE_PASSWORD'),
      entities: ['dist/**/*.entity.{ts,js}'],
      migrations: ['dist/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'file' as const,
      synchronize: false, // never use TRUE in production!
      extra: {
        ...sslConfig,
        // Add connection timeout and retry settings
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        max: 20,
        // Add retry configuration
        retryDelayMillis: 1000,
        retryAttempts: 3
      }
    };

    console.log('🔍 Final TypeORM config (without password):', {
      ...config,
      password: '[HIDDEN]',
      extra: {
        ...config.extra,
        ssl: config.extra.ssl ? {
          ca: config.extra.ssl.ca ? '[CERTIFICATE LOADED]' : '[NO CERTIFICATE]',
          rejectUnauthorized: config.extra.ssl.rejectUnauthorized
        } : '[NO SSL CONFIG]'
      }
    });

    return config;
  }

  private getSslConfig(): any {
    try {
      const certPath = 'certs/rds-combined-ca-bundle.pem';
      console.log('🔍 Checking SSL certificate at:', certPath);
      console.log('🔍 Current working directory:', process.cwd());
      
      if (fs.existsSync(certPath)) {
        console.log('✅ SSL certificate found, loading...');
        const certContent = fs.readFileSync(certPath).toString();
        console.log('✅ SSL certificate loaded successfully, size:', certContent.length, 'characters');
        
        return {
          ssl: {
            ca: certContent,
            rejectUnauthorized: false
          },
        };
      } else {
        console.warn('⚠️  SSL certificate not found at:', certPath);
        console.warn('⚠️  Available files in certs directory:');
        try {
          const files = fs.readdirSync('certs');
          console.warn('Files:', files);
        } catch (err) {
          console.warn('Could not read certs directory:', err.message);
        }
        
        console.warn('⚠️  Using basic SSL connection without certificate');
        return {
          ssl: {
            rejectUnauthorized: false
          },
        };
      }
    } catch (error) {
      console.error('❌ Error loading SSL certificate:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.warn('⚠️  Falling back to basic SSL connection');
      return {
        ssl: {
          rejectUnauthorized: false
        },
      };
    }
  }

  public workDataSource(): DataSource {
    const sslConfig = this.getSslConfig();
    
    const AppDataSource = new DataSource({
      type: 'postgres',
      host: this.config.get<string>('DATABASE_HOST'),
      port: this.config.get<number>('DATABASE_PORT'),
      database: this.config.get<string>('DATABASE_NAME'),
      username: this.config.get<string>('DATABASE_USER'),
      password: this.config.get<string>('DATABASE_PASSWORD'),
      entities: ['dist/**/*.entity.{ts,js}'],
      migrations: ['dist/migrations/*.{ts,js}'],
      subscribers: ["src/subscriber/**/*.ts"],
      migrationsTableName: 'typeorm_migrations',
      logger: 'file' as const,
      synchronize: false, // never use TRUE in production!
      extra: {
        ...sslConfig,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        max: 20
      }
    });

    AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })
    

    return AppDataSource;
  }

}


