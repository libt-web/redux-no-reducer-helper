import babel from 'rollup-plugin-babel';

export default {
    input:'lib/index.js',
    output:{
        file:'index.js',
        format:'cjs'
    },
    plugins:[
        babel()
    ]
}