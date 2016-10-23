FLAGS = -g -std=c++14 -fPIC
CFLAGS = -g -std=c99 -fPIC

all: directories build/heatmap.o build/heatmap_ctypes.o lib/libheatmap.so

directories: build lib

lib:
	mkdir -p lib

build:
	mkdir -p build

build/heatmap.o : ./heatmap.cpp
	g++ $(FLAGS) -c ./heatmap.cpp -o build/heatmap.o

build/heatmap_ctypes.o : ./heatmap_ctypes.cpp
	g++ $(FLAGS) -c ./heatmap_ctypes.cpp -o build/heatmap_ctypes.o

lib/libheatmap.so : build/heatmap_ctypes.o build/heatmap.o
	g++ $(FLAGS) -shared ./heatmap.cpp ./heatmap_ctypes.cpp -o lib/libheatmap.so

clean :
	rm -f build/* lib/*
