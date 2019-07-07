import typeScript from 'rollup-plugin-typescript2';

export default {
    input: 'lib/index.ts',
    output: {
        file: 'index.js',
        format: 'cjs'
    },
    plugins: [
        typeScript()
    ]
}