"""List helper functions with some bugs and issues."""


def flatten(nested_list):
    # Bug: only flattens one level deep
    result = []
    for item in nested_list:
        if isinstance(item, list):
            result.extend(item)
        else:
            result.append(item)
    return result


def chunk_list(lst, size):
    # Bug: drops the last chunk if it's smaller than size
    return [lst[i:i + size] for i in range(0, len(lst) - size + 1, size)]


def merge_sorted(list1, list2):
    # Bug: doesn't actually merge in sorted order
    return list1 + list2


def unique_elements(lst):
    # Bug: doesn't preserve insertion order
    return list(set(lst))


def rotate_list(lst, k):
    # Bug: doesn't handle k > len(lst)
    return lst[k:] + lst[:k]


def interleave(list1, list2):
    # Bug: drops extra elements from the longer list
    result = []
    for a, b in zip(list1, list2):
        result.append(a)
        result.append(b)
    return result


def find_pairs_with_sum(lst, target):
    # Bug: can pair an element with itself
    pairs = []
    for i in range(len(lst)):
        for j in range(len(lst)):
            if lst[i] + lst[j] == target:
                pairs.append((lst[i], lst[j]))
    return pairs


def moving_average(lst, window):
    # Bug: off-by-one in range
    if not lst or window <= 0:
        return []
    result = []
    for i in range(len(lst) - window):
        avg = sum(lst[i:i + window]) / window
        result.append(avg)
    return result


if __name__ == "__main__":
    print(flatten([1, [2, 3], [[4, 5]]]))  # Expected [1,2,3,4,5], gets [1,2,3,[4,5]]
    print(chunk_list([1, 2, 3, 4, 5], 2))  # Drops [5]
    print(merge_sorted([1, 3, 5], [2, 4, 6]))  # Not sorted
    print(rotate_list([1, 2, 3], 5))  # Breaks with k > len
    print(find_pairs_with_sum([1, 2, 3], 4))  # Includes (2,2)
