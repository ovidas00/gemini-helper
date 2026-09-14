import { Type, type FunctionDeclaration } from '@google/genai';

export const chatTools: FunctionDeclaration[] = [
  {
    name: 'add_numbers',
    description: 'Adds two numbers together.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        a: {
          type: Type.NUMBER,
          description: 'First number',
        },
        b: {
          type: Type.NUMBER,
          description: 'Second number',
        },
      },
      required: ['a', 'b'],
    },
  },

  {
    name: 'multiply_numbers',
    description: 'Multiplies two numbers together.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        a: {
          type: Type.NUMBER,
          description: 'First number',
        },
        b: {
          type: Type.NUMBER,
          description: 'Second number',
        },
      },
      required: ['a', 'b'],
    },
  },

  {
    name: 'get_current_time',
    description: 'Returns the current server date and time.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },

  {
    name: 'get_server_info',
    description: 'Returns basic information about the server.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export async function executeTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'add_numbers':
      return {
        result: Number(args.a) + Number(args.b),
      };

    case 'multiply_numbers':
      return {
        result: Number(args.a) * Number(args.b),
      };

    case 'get_current_time':
      return {
        iso: new Date().toISOString(),
        local: new Date().toString(),
      };

    case 'get_server_info':
      return {
        platform: process.platform,
        nodeVersion: process.version,
        architecture: process.arch,
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
