Production
  = probability:Number? '->' successor:StatementList {
      var result = {};
      
      if (probability) {
        result.probability = probability;
      }
      result.successor = successor;
      
      return result;
    }

  / after:Command '<' c:Command '>' before:Command '->' successor:StatementList {
      var result = {};
      
      result.after = after;
      result.before = before;
      result.successor = successor;
      
      return result;
    }

  / after:Command '<' c:Command '->' successor:StatementList {
      var result = {};

      result.after = after;
      result.successor = successor;

      return result;
    }

  / c:Command '>' before:Command '->' successor:StatementList {
      var result = {};

      result.before = before;
      result.successor = successor;

      return result;
    }

  / '(' condition:RelationalExpression ')' '->' successor:StatementList {
      var result = {};

      result.condition = condition;
      result.successor = successor;

      return result;
    }

  / program:StatementList {
      return program;
    }

StatementList
  = statements:Statement* { 
      return statements;
    }
 
Statement
  = Branch
  / Module

Branch
  = '[' statements:Statement+ ']' {
      return statements;
    }

Module
  = command:Command params:('(' ParameterList ')')? {
      var result = {
        c: command
      };
      
      if (params) {
        result.p = params[1];
      }
      
      return result;
    }

ParameterList
  = head:Parameter tail:("," Parameter)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1])
      }
      return result;
    }

Parameter
  = e:ArithmeticExpression { return e; }

Command
  = c:[a-zA-Z0-9~`!@#$%^&*()_+-={}\|<>,./?] { return c; }

RelationalExpression
  = left:ArithmeticExpression op:RelationalOperator right:ArithmeticExpression {
      return left + op + right;
    }

RelationalOperator
  = '<'
  / '>'
  / '<='
  / '>='
  / '=='
  / '!='

ArithmeticExpression
  = '(' left:ArithmeticExpression op:ArithmeticOperator right:ArithmeticExpression ')' { return '(' + left + op + right + ')'; }
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

Identifier
  = before:[a-zA-Z] after:[a-zA-Z0-9]* { return before + after.join(''); }

Integer
  = sign:[+-]? digits:[0-9]+ { return parseInt(sign + digits.join(""), 10); }

Float
  = sign:[+-]? before:[0-9]* "." after:[0-9]+ {
      return parseFloat(sign + before.join("") + "." + after.join(""));
    }
