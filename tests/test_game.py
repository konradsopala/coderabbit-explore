from snake.game import DIRECTIONS, GameConfig, create_initial_state, place_food, set_direction, step


def constant_rng(value: float):
    return lambda: value


def test_snake_moves_one_cell_in_current_direction():
    state = create_initial_state(GameConfig(width=10, height=10, start_length=3), constant_rng(0.0))
    nxt = step(state, constant_rng(0.0))

    assert nxt.snake[0][0] == state.snake[0][0] + 1
    assert nxt.snake[0][1] == state.snake[0][1]
    assert len(nxt.snake) == len(state.snake)


def test_snake_grows_and_increments_score_when_eating_food():
    state = create_initial_state(GameConfig(width=8, height=8, start_length=2), constant_rng(0.0))
    forced = state.__class__(
        config=state.config,
        snake=state.snake,
        direction=state.direction,
        pending_direction=state.pending_direction,
        food=(state.snake[0][0] + 1, state.snake[0][1]),
        score=state.score,
        status=state.status,
        paused=state.paused,
    )

    nxt = step(forced, constant_rng(0.0))

    assert len(nxt.snake) == len(forced.snake) + 1
    assert nxt.score == forced.score + 1
    assert nxt.food is not None


def test_wall_collision_ends_the_game():
    base = create_initial_state(GameConfig(width=4, height=4, start_length=2), constant_rng(0.0))
    state = base.__class__(
        config=base.config,
        snake=((3, 1), (2, 1)),
        direction=DIRECTIONS["RIGHT"],
        pending_direction=DIRECTIONS["RIGHT"],
        food=base.food,
        score=base.score,
        status=base.status,
        paused=base.paused,
    )

    nxt = step(state, constant_rng(0.0))
    assert nxt.status == "game_over"


def test_self_collision_ends_the_game():
    base = create_initial_state(GameConfig(width=8, height=8, start_length=4), constant_rng(0.0))
    state = base.__class__(
        config=base.config,
        snake=((3, 3), (3, 2), (2, 2), (2, 3), (2, 4), (3, 4)),
        direction=DIRECTIONS["UP"],
        pending_direction=DIRECTIONS["LEFT"],
        food=base.food,
        score=base.score,
        status=base.status,
        paused=base.paused,
    )

    nxt = step(state, constant_rng(0.0))
    assert nxt.status == "game_over"


def test_cannot_reverse_direction_directly():
    state = create_initial_state(rng=constant_rng(0.0))
    nxt = set_direction(state, DIRECTIONS["LEFT"])

    assert nxt.pending_direction == state.pending_direction


def test_food_placement_never_returns_occupied_snake_cell():
    snake = ((0, 0), (1, 0), (2, 0))
    food = place_food(snake, 4, 4, constant_rng(0.0))

    assert food is not None
    assert food not in snake
