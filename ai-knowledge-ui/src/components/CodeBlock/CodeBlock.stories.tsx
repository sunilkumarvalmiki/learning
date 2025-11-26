import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
    title: 'Components/CodeBlock',
    component: CodeBlock,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const jsCode = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet("World");`;

const pythonCode = `def fibonacci(n):
    """Calculate Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test
print(fibonacci(10))`;

const tsxCode = `import React, { useState } from 'react';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};`;

const sqlCode = `SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.active = true
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 5
ORDER BY post_count DESC
LIMIT 10;`;

export const JavaScript: Story = {
    args: {
        code: jsCode,
        language: 'javascript',
        filename: 'greet.js',
    },
};

export const Python: Story = {
    args: {
        code: pythonCode,
        language: 'python',
        filename: 'fibonacci.py',
    },
};

export const TypeScriptReact: Story = {
    args: {
        code: tsxCode,
        language: 'tsx',
        filename: 'Counter.tsx',
    },
};

export const SQL: Story = {
    args: {
        code: sqlCode,
        language: 'sql',
        filename: 'query.sql',
    },
};

export const NoLineNumbers: Story = {
    args: {
        code: jsCode,
        language: 'javascript',
        filename: 'example.js',
        showLineNumbers: false,
    },
};

export const NoFilename: Story = {
    args: {
        code: jsCode,
        language: 'javascript',
    },
};

export const NoCopyButton: Story = {
    args: {
        code: jsCode,
        language: 'javascript',
        filename: 'example.js',
        copyable: false,
    },
};

export const MinimalConfig: Story = {
    args: {
        code: 'npm install ai-knowledge-ui',
        language: 'bash',
        showLineNumbers: false,
        copyable: true,
    },
};

export const LongCode: Story = {
    args: {
        code: `// Long example demonstrating horizontal scroll
const veryLongVariableNameThatExceedsTheWidthOfTheCodeBlock = "This is a very long line of code that will require horizontal scrolling";

function anotherVeryLongFunctionNameThatDemonstratesHorizontalScrolling() {
  console.log("The code block supports horizontal scrolling for long lines");
  return veryLongVariableNameThatExceedsTheWidthOfTheCodeBlock;
}

// More code
const data = {
  property1: "value1",
  property2: "value2",
  property3: "value3",
};`,
        language: 'javascript',
        filename: 'long-example.js',
    },
};

export const MultipleBlocks: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CodeBlock
                code={`npm install @ai-knowledge/core`}
                language="bash"
                filename="Installation"
                showLineNumbers={false}
            />
            <CodeBlock
                code={jsCode}
                language="javascript"
                filename="app.js"
            />
            <CodeBlock
                code={pythonCode}
                language="python"
                filename="fibonacci.py"
            />
        </div>
    ),
};

export const InlineWithText: Story = {
    render: () => (
        <div style={{ maxWidth: '800px' }}>
            <h2>Installation Guide</h2>
            <p>First, install the package using npm:</p>
            <CodeBlock
                code="npm install ai-knowledge-ui"
                language="bash"
                showLineNumbers={false}
            />
            <p>Then, import the components you need:</p>
            <CodeBlock
                code={`import { Button, Input, Card } from 'ai-knowledge-ui';`}
                language="javascript"
                showLineNumbers={false}
            />
            <p>Now you're ready to build!</p>
        </div>
    ),
};
