(function() {
  exports.presets = [
    {
      name: '1.6 Koch Island',
      description: 'From page 8 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 3,
      axiom: 'F-F-F-F',
      productions: 'F -> F-F+F+FF-F-F+F'
    },
    {
      name: '1.7a Quadratic Koch Island',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 2,
      axiom: 'F-F-F-F',
      productions: 'F -> F+FF-FF-F-F+F+FF-F-F+F+FF+FF-F'
    },
    {
      name: '1.7b Quadratic Snowflake Curve',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 4,
      axiom: '-F',
      productions: 'F -> F+F-F-F+F'
    },
    {
      name: '1.8 Combination of Islands and Lakes',
      description: 'From page 9 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 2,
      axiom: 'F+F+F+F',
      productions: 'F -> F+f-FF+F+FF+Ff+FF-f+FF-F-FF-Ff-FFF\nf->ffffff'
    },
    {
      name: '1.9a',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 4,
      axiom: 'F-F-F-F',
      productions: 'F -> FF-F-F-F-F-F+F'
    },
    {
      name: '1.9b',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 4,
      axiom: 'F-F-F-F',
      productions: 'F -> FF-F-F-F-FF'
    },
    {
      name: '1.9c',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 3,
      axiom: 'F-F-F-F',
      productions: 'F -> FF-F+F-F-FF'
    },
    {
      name: '1.9d',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 4,
      axiom: 'F-F-F-F',
      productions: 'F -> FF-F--F-F'
    },
    {
      name: '1.9e',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 5,
      axiom: 'F-F-F-F',
      productions: 'F -> F-FF--F-F'
    },
    {
      name: '1.9f',
      description: 'From page 10 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 4,
      axiom: 'F-F-F-F',
      productions: 'F -> F-F+F-F-F'
    },
    {
      name: '1.10a',
      description: 'From page 11 of "Algorithmic Beauty of Plants".',
      tags: ['Fractals'],
      iterations: 5,
      axiom: 'F-F-F-F',
      productions: 'F -> F-F+F-F-F'
    },
    {
      name: '1.24a',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 5,
      axiom: 'F(3)',
      productions: 'F -> F(n)[-(25.7)F(n)]F(n)[+(25.7)F(n)]F(n)'
    },
    {
      name: '1.24b',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 5,
      axiom: 'F(7)',
      productions: 'F -> F(n)[+(20)F(n)]F(n)[-(20)F(n)][F(n)]'
    },
    {
      name: '1.24c',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 5,
      axiom: 'F(7)',
      productions: 'F -> F(n)F(n)-(22.5)[-(22.5)F(n)+(22.5)F(n)+(22.5)F(n)]+(22.5)[+(22.5)F(n)-(22.5)F(n)-(22.5)F(n)]'
    },
    {
      name: '1.24d',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 7,
      axiom: 'X',
      productions: 'X -> F(3)[-(20)X]F(3)[+(20)X]-(20)X\nF -> F(n)F(n)'
    },
    {
      name: '1.24e',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 7,
      axiom: 'X',
      productions: 'X -> F(3)[+(25.7)X][-(25.7)X]F(3)X\nF -> F(n)F(n)'
    },
    {
      name: '1.24f',
      description: 'From page 25 of "Algorithmic Beauty of Plants"',
      tags: ['Trees'],
      iterations: 5,
      axiom: 'X',
      productions: 'X -> F(7)-(22.5)[[X]+(22.5)X]+(22.5)F(7)[+(22.5)F(7)X]-(22.5)X\nF->F(n)F(n)'
    }
  ];
})();