/**
 * OpenTelemetry Distributed Tracing Configuration
 * Supports Jaeger and Tempo backends
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | null = null;

export function initializeTracing() {
  // Only initialize if tracing is enabled
  if (process.env.ENABLE_TRACING !== 'true') {
    console.log('Tracing is disabled');
    return;
  }

  const serviceName = process.env.SERVICE_NAME || 'ai-knowledge-backend';
  const environment = process.env.NODE_ENV || 'development';

  // Create resource with service information
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '0.1.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
  });

  // Configure exporter based on backend
  let traceExporter;

  if (process.env.TRACING_BACKEND === 'tempo') {
    // Tempo (OTLP)
    traceExporter = new OTLPTraceExporter({
      url: process.env.TEMPO_URL || 'http://tempo:4318/v1/traces'
    });
  } else {
    // Jaeger (default)
    traceExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
      agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831')
    });
  }

  // Initialize SDK with auto-instrumentation
  sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable instrumentations you don't need
        '@opentelemetry/instrumentation-fs': {
          enabled: false
        },
        // Configure HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingPaths: ['/health', '/metrics']
        },
        // Configure Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true
        },
        // Configure database instrumentations
        '@opentelemetry/instrumentation-pg': {
          enabled: true
        }
      })
    ]
  });

  // Start the SDK
  sdk.start();

  console.log(`Tracing initialized with ${process.env.TRACING_BACKEND || 'jaeger'} backend`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}

/**
 * Get the active tracer
 */
export function getTracer() {
  return trace.getTracer('ai-knowledge-backend', process.env.APP_VERSION || '0.1.0');
}

/**
 * Create a custom span
 */
export function createSpan(name: string, fn: () => Promise<any>) {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add custom attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Trace document processing
 */
export async function traceDocumentProcessing(
  documentId: string,
  operation: string,
  fn: () => Promise<any>
) {
  const tracer = getTracer();
  return tracer.startActiveSpan(`document.${operation}`, async (span) => {
    span.setAttribute('document.id', documentId);
    span.setAttribute('document.operation', operation);

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Trace search operations
 */
export async function traceSearch(
  searchType: string,
  query: string,
  fn: () => Promise<any>
) {
  const tracer = getTracer();
  return tracer.startActiveSpan(`search.${searchType}`, async (span) => {
    span.setAttribute('search.type', searchType);
    span.setAttribute('search.query', query.substring(0, 100)); // Truncate for privacy

    try {
      const result = await fn();
      span.setAttribute('search.results_count', result.results?.length || 0);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Trace database operations
 */
export async function traceDbOperation(
  operation: string,
  table: string,
  fn: () => Promise<any>
) {
  const tracer = getTracer();
  return tracer.startActiveSpan(`db.${operation}`, async (span) => {
    span.setAttribute('db.operation', operation);
    span.setAttribute('db.table', table);
    span.setAttribute('db.system', 'postgresql');

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Extract trace context from request headers
 */
export function extractTraceContext(headers: Record<string, any>) {
  // OpenTelemetry will automatically extract trace context from headers
  // This is handled by the auto-instrumentation
  return context.active();
}

/**
 * Inject trace context into outgoing requests
 */
export function injectTraceContext(headers: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    // OpenTelemetry will automatically inject trace context
    // This is handled by the auto-instrumentation
  }
  return headers;
}
