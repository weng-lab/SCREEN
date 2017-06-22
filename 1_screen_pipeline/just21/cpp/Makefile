EXT_PATH=$(realpath ./external)
COMMON_PATH=$(realpath ./common)

include ./makefile-common.mk

FLAGS = -g -std=c++11 -fPIC
CFLAGS = -g -std=c99 -fPIC

OBJ_DIR := build
OBJ := $(addprefix $(OBJ_DIR)/, $(patsubst %.cpp, %.o, $(call rwildcard, src/, *.cpp)))
HEADERS = $(call rwildcard, src/, *.h) \
	$(call rwildcard, src/, *.hpp)
BIN := bin/test
LIB := lib/libscreen.so

.PHONY: all
all: directories $(OBJ_DIR) $(BIN) $(LIB)

$(OBJ_DIR)/%.o: %.cpp $(HEADERS)
	@mkdir -p $(OBJ_DIR)/$(shell dirname $<)
	$(CPP) $(FLAGS) $(SRC) $(COMLIBS) -c -o $@ $<

$(BIN): $(OBJ)
	$(CPP) -o $@ $^ $(LD_FLAGS)

directories:
	mkdir -p $(OBJ_DIR) bin lib

$(LIB): $(OBJ)
	$(CPP) -shared -o $@ $^ $(LD_FLAGS)

clean :
	rm -rf build/* lib/* bin/*
