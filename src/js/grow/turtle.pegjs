prog
  = statements:stmt+ { 
      return statements;
    }
 
stmt
  = branch
  / command

branch
  = '[' statements:stmt+ ']' {
      return statements;
    }

command
  = command:[a-zA-Z0-9~`!@#$%^&*()_+-={}\|<>,./?] params:('(' params ')')? {
      var result = {
        c: command
      };
      
      if (params) {
        result.p = params[1];
      }
      
      return result;
    }

params
  = head:literal tail:("," literal)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1])
      }
      return result;
    }
  
/**
 * Lexicon 
 * - https://github.com/dmajda/pegjs/blob/master/examples/css.pegjs
 */

literal
  = n:float { return n; }
  / n:integer { return n; }

integer
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

float
  = before:[0-9]* "." after:[0-9]+ {
      return parseFloat(before.join("") + "." + after.join(""));
    }
