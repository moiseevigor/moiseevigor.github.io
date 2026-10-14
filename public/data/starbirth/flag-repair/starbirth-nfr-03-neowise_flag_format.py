"""Decode retained NEOWISE W1/W2 quality positions without padding or coercion."""
def w2_photo_quality(literal):
    if not isinstance(literal, str):
        return None
    if len(literal) == 2:
        active = literal
    elif len(literal) == 4 and literal[2:] == 'XX':
        active = literal[:2]
    else:
        return None
    if any(value not in 'ABCUX' for value in active):
        return None
    return active[1]
