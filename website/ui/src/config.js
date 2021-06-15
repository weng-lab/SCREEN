{
    "RE": {
	"version": 13,
	"db_host": "pg_beta_screen",
	"db_usr": "postgres",
	"db_port": 5432,
	"db": "screen_v13",
	"assemblies": [
	    "GRCh38",
	    "mm10"
	],
	"partial_assemblies": [
	    
	],
	"minipeaks_ver": 6,
	"minipeaks_nbins": 20,
	"ribbon": "beta",
	"googleAnalytics": false,
	"memcache": false,
	"cassandra": [
	    "cassandra_v13"
	],
	"redisHost": "127.0.0.1",
	"downloadDir": "/data/uploads/",
	"rnaSeqIsNorm": true
    },
    "bedupload": {
	"incomingDir": "/bed_intersect/incoming",
	"hg19bed": "/bed_intersect/hg19.sorted.bed",
	"mm10bed": "/bed_intersect/mm10.sorted.bed",
	"grch38bed": "/bed_intersect/grch38.sorted.bed"
    },
    "UI": {
	"apiServer": "https://api.wenglab.org/screen_v13",
	"minipeakServer": "https://api.wenglab.org/screen_v13/dataws/re_detail/",
	"bed_intersect": "https://api.wenglab.org/screen_v13/postws/lines",
	"staticServer": "/assets",
	"overrides": {
	    
	}
    }
}
