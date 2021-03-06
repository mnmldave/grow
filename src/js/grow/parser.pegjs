/*!
 * Copyright (c) 2011 Dave Heaton
 * Freely distributable under the MIT license.
 */
/*
 * PEG based on lsystem grammar outlined in "The Algorithmic Beauty of Plants"
 * by Przemyslaw Prusinkiewicz and Aristid Lindenmayer.
 *
 * by Dave Heaton <dave@bit155.com>
 */

start
  = _ p:ProductionList _ { return p; }
  / _ p:Program _ { return p; }

Command
  = c:[a-zA-Z0-9+-/\&^@[\]] { return c; }

ProductionList
  = head:Production _ tail:(ProductionDelimiter _ Production)* {
        var elements = [], i;
        
        elements.push(head);
        for (i = 0; i < tail.length; i++) {
          elements.push(tail[i][2]);
        }
        
        return {
          type: 'ProductionList',
          elements: elements 
        };
      }

Production
  = pre:(Command _ '<' _)?
    c:Command
    variables:('(' _ IdentifierList _ ')')? 
    post:(_ '>' _ Command)?
    condition:(_ ':' _ BooleanExpression)? 
    _ '->' _ 
    successor:StatementList {
      var result = {};
      
      result.c = c;
      if (variables) {
        result.variables = variables[2];
      }
      if (pre) {
        result.pre = pre[0];
      }
      if (post) {
        result.post = post[3];
      }
      if (condition) {
        result.condition = condition[3];
      }
      result.successor = successor;
      
      return result;
    }

ProductionDelimiter
  = [;\n\r]+

Program
  = elements:StatementList {
      return {
        type: 'Program',
        elements: elements
      };
    }

StatementList
  = statements:(_ Statement)* { 
      var result = [], i;
      for (i = 0; i < statements.length; i++) {
        result.push(statements[i][1]);
      }
      return result;
    }
 
Statement
  = command:Command params:('(' _ ParameterList _ ')')? {
      var result = {
        c: command
      };
      
      if (params) {
        result.p = params[2];
      }
      
      return result;
    }

ParameterList
  = head:Parameter _ tail:("," _ Parameter)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][2])
      }
      return result;
    }

Parameter
  = e:ArithmeticExpression { return e; }

BooleanExpression
  = left:BooleanElement _ op:BooleanOperator _ right:BooleanElement {
      return {
        type: 'BinaryOperation',
        op: op,
        left: left,
        right: right
      };
    }
  / '!' _ '(' element:BooleanElement ')' { 
      return {
        type: 'UnaryOperation',
        op: '!',
        element: element
      };
    }
  / RelationalExpression
  
BooleanElement
  = '(' _ expr:BooleanExpression _ ')' { return expr; }
  / RelationalExpression
  / BooleanConstant

BooleanConstant
  = 'true'
  / 'false'

BooleanOperator
  = '&&'
  / '||'

RelationalExpression
  = left:RelationalElement _ op:RelationalOperator _ right:RelationalElement {
      return {
        type: 'BinaryOperation',
        op: op,
        left: left,
        right: right
      };
    }

RelationalElement
  = expr:ArithmeticExpression { return expr; }

RelationalOperator
  = '<'
  / '>'
  / '<='
  / '>='
  / '=='
  / '!='

ArithmeticExpression
  = left:ArithmeticElement _ op:ArithmeticOperator _ right:ArithmeticElement { 
      return {
        type: 'BinaryOperation',
        op: op,
        left: left,
        right: right
      };
    }
  / ArithmeticElement

ArithmeticElement
  = '(' _ expr:ArithmeticExpression _ ')' { return expr; }
  / v:ArithmeticValue { return v; }

ArithmeticOperator
  = '+'
  / '-'
  / '*'
  / '/'
  / '^'

ArithmeticValue
  = v:Identifier { return v; }
  / n:Number { return n; }
  
Number
  = n:Float { return n; }
  / n:Integer { return n; }

IdentifierList
  = head:Identifier tail:(',' _ Identifier)* {
        var result = [head], i;
        for (i = 0; i < tail.length; i++) {
          result.push(tail[i][2]);
        }
        return result;
      }

Identifier
  = before:[a-zA-Z] after:[a-zA-Z0-9]* { return before + after.join(''); }

Integer
  = sign:[+-]? digits:[0-9]+ { return parseInt(sign + digits.join(""), 10); }

Float
  = sign:[+-]? before:[0-9]* "." after:[0-9]+ {
      return parseFloat(sign + before.join("") + "." + after.join(""));
    }

_
  = [ \t]*