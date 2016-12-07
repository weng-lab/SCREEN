#pragma once

#include <memory>
#include <deque>
#include <zi/mutex.hpp>

template <class T>
class SimpleObjectPool {
private:
    std::vector<std::shared_ptr<T>> free_;
    zi::spinlock lock_;

public:
    SimpleObjectPool(){
        zi::guard g(lock_);
        free_.reserve(50);
    }

    ~SimpleObjectPool(){
        /*
        zi::guard g(lock_);
        std::cout << "SimpleObjectPool size was: "
                  << free_.size()
                  << std::endl;
        */
    }

    std::shared_ptr<T> get(){
        {
            zi::guard g(lock_);
            if(!free_.empty()){
                auto ret = free_.back();
                free_.pop_back();
                return ret;
            }
        }
        return std::make_shared<T>();
    }

    template <typename C>
    std::shared_ptr<T> get(C& c){
        {
            zi::guard g(lock_);
            if(!free_.empty()){
                auto ret = free_.back();
                free_.pop_back();
                return ret;
            }
        }
        return std::make_shared<T>(c);
    }

    void put(std::shared_ptr<T> p){
        zi::guard g(lock_);
        free_.push_back(p);
    }

};
