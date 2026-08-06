def strip_js_comments(text):
    out = []
    i = 0
    n = len(text)
    state = 'NORMAL'
    template_stack = []
    last_char = None
    
    def is_jsx_comment_start(idx):
        j = idx + 1
        while j < n and text[j].isspace():
            j += 1
        if j + 1 < n and text[j] == '/' and text[j+1] == '*':
            k = idx - 1
            while k >= 0 and text[k].isspace():
                k -= 1
            if k < 0 or text[k] in {'>', '}'}:
                return True, j + 2
        return False, None

    while i < n:
        c = text[i]
        next_c = text[i+1] if i + 1 < n else ''
        
        if state == 'NORMAL':
            is_jsx, comment_start_idx = is_jsx_comment_start(i)
            if is_jsx:
                state = 'JSX_COMMENT'
                i = comment_start_idx
                continue
            
            if c == '/' and next_c == '/':
                state = 'SINGLE_COMMENT'
                i += 2
                continue
            elif c == '/' and next_c == '*':
                state = 'MULTI_COMMENT'
                i += 2
                continue
            elif c == "'":
                state = 'SINGLE_STRING'
                out.append(c)
                i += 1
                continue
            elif c == '"':
                state = 'DOUBLE_STRING'
                out.append(c)
                i += 1
                continue
            elif c == '`':
                state = 'TEMPLATE_STRING'
                out.append(c)
                i += 1
                continue
            elif c == '/':
                is_regex = False
                if last_char is None or last_char in {'(', '[', '{', ';', ',', '=', ':', '?', '&', '|', '^', '!', '~', '+', '-', '*', '%', '<', '>', '/'}:
                    is_regex = True
                else:
                    k = i - 1
                    while k >= 0 and text[k].isspace():
                        k -= 1
                    if k >= 0 and (text[k].isalnum() or text[k] == '_'):
                        word_chars = []
                        while k >= 0 and (text[k].isalnum() or text[k] == '_'):
                            word_chars.append(text[k])
                            k -= 1
                        word = "".join(reversed(word_chars))
                        if word in {'return', 'throw', 'yield', 'await', 'case', 'typeof', 'delete', 'void', 'instanceof', 'in', 'new', 'default'}:
                            is_regex = True
                
                if is_regex:
                    state = 'REGEX'
                    out.append(c)
                    i += 1
                else:
                    out.append(c)
                    last_char = '/'
                    i += 1
                continue
            else:
                out.append(c)
                if not c.isspace():
                    last_char = c
                
                if c == '{':
                    if template_stack:
                        prev_state, brace_count = template_stack[-1]
                        template_stack[-1] = (prev_state, brace_count + 1)
                elif c == '}':
                    if template_stack:
                        prev_state, brace_count = template_stack[-1]
                        if brace_count == 1:
                            template_stack.pop()
                            state = prev_state
                        else:
                            template_stack[-1] = (prev_state, brace_count - 1)
                i += 1
                continue
                
        elif state == 'SINGLE_STRING':
            if c == '\\':
                out.append(c)
                if i + 1 < n:
                    out.append(text[i+1])
                i += 2
            elif c == "'":
                state = 'NORMAL'
                out.append(c)
                last_char = "'"
                i += 1
            else:
                out.append(c)
                i += 1
                
        elif state == 'DOUBLE_STRING':
            if c == '\\':
                out.append(c)
                if i + 1 < n:
                    out.append(text[i+1])
                i += 2
            elif c == '"':
                state = 'NORMAL'
                out.append(c)
                last_char = '"'
                i += 1
            else:
                out.append(c)
                i += 1
                
        elif state == 'TEMPLATE_STRING':
            if c == '\\':
                out.append(c)
                if i + 1 < n:
                    out.append(text[i+1])
                i += 2
            elif c == '`':
                state = 'NORMAL'
                out.append(c)
                last_char = '`'
                i += 1
            elif c == '$' and next_c == '{':
                template_stack.append(('TEMPLATE_STRING', 1))
                state = 'NORMAL'
                out.append(c)
                out.append(next_c)
                last_char = '{'
                i += 2
            else:
                out.append(c)
                i += 1
                
        elif state == 'REGEX':
            if c == '\\':
                out.append(c)
                if i + 1 < n:
                    out.append(text[i+1])
                i += 2
            elif c == '[':
                out.append(c)
                i += 1
                while i < n:
                    bc = text[i]
                    if bc == '\\':
                        out.append(bc)
                        if i + 1 < n:
                            out.append(text[i+1])
                        i += 2
                    elif bc == ']':
                        out.append(bc)
                        i += 1
                        break
                    else:
                        out.append(bc)
                        i += 1
            elif c == '/':
                state = 'NORMAL'
                out.append(c)
                last_char = '/'
                i += 1
            else:
                out.append(c)
                i += 1
                
        elif state == 'SINGLE_COMMENT':
            if c == '\n' or c == '\r':
                state = 'NORMAL'
            else:
                i += 1
                
        elif state == 'MULTI_COMMENT':
            if c == '*' and next_c == '/':
                state = 'NORMAL'
                i += 2
            else:
                i += 1
                
        elif state == 'JSX_COMMENT':
            if c == '*' and next_c == '/':
                j = i + 2
                while j < n and text[j].isspace():
                    j += 1
                if j < n and text[j] == '}':
                    state = 'NORMAL'
                    i = j + 1
                else:
                    state = 'NORMAL'
                    i += 2
            else:
                i += 1
                
    return "".join(out)

# Tests
test_cases = [
    ("const x = 1; // comment", "const x = 1; "),
    ("const url = 'http://example.com'; // comment", "const url = 'http://example.com'; "),
    ("const regex = /http:\\/\\//; // comment", "const regex = /http:\\/\\//; "),
    ("const x = `hello ${foo + `world ${bar // nested comment\n}`}!`;", "const x = `hello ${foo + `world ${bar \n}`}!`;"),
    ("<div>\n  {/* JSX Comment */}\n  <span>Text</span>\n</div>", "<div>\n  \n  <span>Text</span>\n</div>"),
    ("} catch { /* ignore */ }", "} catch {  }"),
    ("const a = 5 / 2; // division", "const a = 5 / 2; "),
]

for idx, (inp, exp) in enumerate(test_cases):
    res = strip_js_comments(inp)
    assert res == exp, f"Test {idx} failed:\nInput: {repr(inp)}\nExpected: {repr(exp)}\nGot:      {repr(res)}"

print("All JS tests passed!")
